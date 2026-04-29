import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Issue, IssueStatus, Vote, Authority, ZipCode } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const ISSUES_PATH = 'issues';
const ZIP_CODES_PATH = 'zipCodes';

export const issueService = {
  async createIssue(issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'votesCount' | 'status'>) {
    try {
      const docRef = await addDoc(collection(db, ISSUES_PATH), {
        ...issueData,
        status: IssueStatus.COMMUNITY_POLL,
        votesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, ISSUES_PATH);
    }
  },

  async voteForIssue(issueId: string, customUserId?: string) {
    if (!auth.currentUser && !customUserId) throw new Error("Must be signed in to vote");
    const userId = customUserId || auth.currentUser!.uid;
    const votePath = `${ISSUES_PATH}/${issueId}/votes/${userId}`;

    try {
      await runTransaction(db, async (transaction) => {
        const voteDocRef = doc(db, ISSUES_PATH, issueId, 'votes', userId);
        const issueDocRef = doc(db, ISSUES_PATH, issueId);
        
        const voteSnap = await transaction.get(voteDocRef);
        if (voteSnap.exists()) {
          throw new Error("You have already voted for this issue");
        }

        transaction.set(voteDocRef, {
          userId,
          issueId,
          createdAt: serverTimestamp(),
        });

        transaction.update(issueDocRef, {
          votesCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "You have already voted for this issue") {
        throw error;
      }
      handleFirestoreError(error, OperationType.WRITE, votePath);
    }
  },

  async removeVote(issueId: string, customUserId?: string) {
    if (!auth.currentUser && !customUserId) throw new Error("Must be signed in to remove support");
    const userId = customUserId || auth.currentUser!.uid;
    const votePath = `${ISSUES_PATH}/${issueId}/votes/${userId}`;

    try {
      await runTransaction(db, async (transaction) => {
        const voteDocRef = doc(db, ISSUES_PATH, issueId, 'votes', userId);
        const issueDocRef = doc(db, ISSUES_PATH, issueId);
        
        const voteSnap = await transaction.get(voteDocRef);
        if (!voteSnap.exists()) {
          throw new Error("You haven't supported this issue yet");
        }

        transaction.delete(voteDocRef);

        transaction.update(issueDocRef, {
          votesCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, votePath);
    }
  },

  async checkIfVoted(issueId: string, customUserId?: string): Promise<boolean> {
    const userId = customUserId || auth.currentUser?.uid;
    if (!userId) return false;
    try {
      const snap = await getDocs(query(collection(db, ISSUES_PATH, issueId, 'votes'), where('userId', '==', userId)));
      return !snap.empty;
    } catch (error) {
      return false;
    }
  },

  async escalateIssue(issueId: string, authorityId: string) {
    const path = `${ISSUES_PATH}/${issueId}`;
    try {
      await updateDoc(doc(db, ISSUES_PATH, issueId), {
        status: IssueStatus.ESCALATED,
        authorityId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteIssue(issueId: string) {
    const path = `${ISSUES_PATH}/${issueId}`;
    try {
      await deleteDoc(doc(db, ISSUES_PATH, issueId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateIssue(issueId: string, data: Partial<Issue>) {
    const path = `${ISSUES_PATH}/${issueId}`;
    try {
      await updateDoc(doc(db, ISSUES_PATH, issueId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  subscribeToIssues(callback: (issues: Issue[]) => void, filters?: { zipCode?: string }) {
    let q = query(collection(db, ISSUES_PATH), orderBy('createdAt', 'desc'));
    
    if (filters?.zipCode) {
      q = query(
        collection(db, ISSUES_PATH), 
        where('zipCode', '==', filters.zipCode),
        orderBy('createdAt', 'desc')
      );
    }

    return onSnapshot(q, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Issue[];
      callback(issues);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, ISSUES_PATH);
    });
  },

  async getZipCodes(): Promise<ZipCode[]> {
    try {
      const q = query(collection(db, ZIP_CODES_PATH), orderBy('code', 'asc'));
      const snap = await getDocs(q);
      if (snap.empty) {
        return this.getFallbackZipCodes();
      }
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ZipCode[];
    } catch (error) {
      return this.getFallbackZipCodes();
    }
  },

  getFallbackZipCodes(): ZipCode[] {
    return [
      { id: '560001', code: '560001', name: 'Shivajinagar' },
      { id: '560002', code: '560002', name: 'City Market' },
      { id: '560003', code: '560003', name: 'Malleshwaram' },
      { id: '560004', code: '560004', name: 'Basavanagudi' },
      { id: '560008', code: '560008', name: 'Indiranagar' },
      { id: '560034', code: '560034', name: 'Koramangala' },
      { id: '560076', code: '560076', name: 'BTM Layout' },
    ];
  },

  async seedZipCodes() {
    const zipCodes = this.getFallbackZipCodes();
    for (const zip of zipCodes) {
      const { id, ...data } = zip;
      await setDoc(doc(db, ZIP_CODES_PATH, id), data);
    }
  },

  async getIssuesByAuthority(authorityId: string): Promise<Issue[]> {
    try {
      const q = query(
        collection(db, ISSUES_PATH),
        where('authorityId', '==', authorityId),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Issue[];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, ISSUES_PATH);
      return [];
    }
  },

  async getAuthorities(zipCode?: string): Promise<Authority[]> {
    const path = 'authorities';
    try {
      const q = query(collection(db, path));
      const snap = await getDocs(q);
      
      // For this prototype, we'll use the fallback list to ensure the requested order and local images
      let data = this.getFallbackAuthorities();
      if (zipCode) {
        data = data.filter(a => a.zipCodes?.includes(zipCode));
      }
      return data;
    } catch (error) {
      let data = this.getFallbackAuthorities();
      if (zipCode) {
        data = data.filter(a => a.zipCodes?.includes(zipCode));
      }
      return data;
    }
  },

  getFallbackAuthorities(): Authority[] {
    return [
      { 
        id: 'pc_mohan', 
        name: 'P.C. Mohan', 
        department: 'MP – Bangalore Central', 
        status: 'In-Office', 
        resolutionCount: 154, 
        photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShKllEfUrTti20bxhkUN6MS6IY_v248y7nGS7eIHSKxgKfyLQ7PMd6Kcdt2l6vWGTQTR6izsBZzJb_lGaXtYcTSY1NTfC1f7IAWubNYJvr&s=10',
        zipCodes: ['560001', '560002', '560008'],
        achievements: [
          'Actively raised urban infrastructure issues like traffic congestion and waste management in Parliament',
          'Promoted development of railway and road connectivity projects in central Bangalore',
          'Advocated for digital governance and citizen grievance redressal systems',
          'Supported initiatives under Smart Cities Mission India for Bengaluru'
        ]
      },
      { 
        id: 'rizwan_arshad', 
        name: 'Rizwan Arshad', 
        department: 'MLA – Shivajinagar', 
        status: 'In-Office', 
        resolutionCount: 82, 
        photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTKbUeqUluFQ6iAV2L9t1YE-TLofoV76OB-HtPW6KDZwfs2Okxbu3nZ1KpSqH84wxYBQ-RIvxesARG1JnqIZymTuor6yk9e8kU1GZxhJDkeg&s=10',
        zipCodes: ['560001'],
        achievements: [
          'Focused on minority welfare and urban housing improvements',
          'Worked on upgrading local infrastructure (roads, drainage, sanitation) in Shivajinagar',
          'Promoted education initiatives and skill development programs for youth',
          'Actively engaged in constituency-level grievance resolution'
        ]
      },
      { 
        id: 'tejasvi_surya', 
        name: 'Tejasvi Surya', 
        department: 'MP – Bangalore South', 
        status: 'On-Field', 
        resolutionCount: 210, 
        photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqNz7IAMedpFdz8EOVzuG3edpY48REt4lx8uq7nIR3-hY-rF8t5y-xxF2rqQ4FMm5takxyecO0WxIx2Tfi_kBywvi4KzRK7e3Va9x-DhUs&s=10',
        zipCodes: ['560004', '560034', '560076'],
        achievements: [
          'Played a key role in Bengaluru COVID-19 volunteer coordination and relief efforts',
          'Advocated for startup ecosystem growth and youth entrepreneurship',
          'Pushed for suburban railway project implementation in Bengaluru',
          'Active in parliamentary debates on technology, economy, and governance'
        ]
      },
      { 
        id: 'ramalinga_reddy', 
        name: 'Ramalinga Reddy', 
        department: 'MLA – BTM Layout', 
        status: 'In-Office', 
        resolutionCount: 195, 
        photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfD5v8B6V_h-c3aO9W5K6vFz9z7G8hK2jO4Q&s=10',
        zipCodes: ['560076', '560034'],
        achievements: [
          'Former Home Minister of Karnataka with focus on law and order reforms',
          'Improved road infrastructure and civic amenities in BTM Layout',
          'Worked on public transport expansion and BMTC improvements',
          'Active in addressing water supply and drainage issues in urban areas'
        ]
      },
      { 
        id: 'shobha_k', 
        name: 'Shobha Karandlaje', 
        department: 'MP – Bangalore North', 
        status: 'In-Office', 
        resolutionCount: 167, 
        photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQjKhdQctK8en6i8YdB4Dujsx5mSVHjjQZ43F_oz-ZTakuvJquO-tpw1IrE1EKjRCInha06JcGVdfSK1rNHLvvW-DwomlEBY2bh7g8OqDv&s=10',
        zipCodes: ['560003'],
        achievements: [
          'Union Minister with contributions in agriculture and farmer welfare policies',
          'Promoted rural development and irrigation initiatives',
          'Advocated for women empowerment and self-help group support programs',
          'Active in national-level policy making and parliamentary committees'
        ]
      },
      { 
        id: 'suresh_kumar', 
        name: 'S. Suresh Kumar', 
        department: 'MLA – Malleshwaram', 
        status: 'In-Office', 
        resolutionCount: 143, 
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/S_Suresh_Kumar_wins_for_consecutive_times_in_the_assembly_elections.jpg',
        zipCodes: ['560003'],
        achievements: [
          'Former Minister for Primary & Secondary Education in Karnataka',
          'Implemented reforms in school education and digital learning initiatives',
          'Focused on civic improvements in Malleshwaram (roads, parks, cleanliness)',
          'Promoted cultural and heritage preservation in Bengaluru'
        ]
      },
    ];
  },

  async seedAuthorities() {
    const authorities = this.getFallbackAuthorities();
    for (const authData of authorities) {
      const { id, ...data } = authData;
      await setDoc(doc(db, 'authorities', id), data);
    }
  }
};
