
/**
 * Smart Election Assistant Logic - Pure State Machine
 */

export interface ChatState {
  step: 'LANGUAGE' | 'MAIN_MENU' | 'EDUCATION' | 'TIMELINE' | 'CITIZEN' | 'VOTER_ID' | 'REGISTRATION' | 'LOCATE' | 'COMPLETE';
  language?: string;
  userName?: string;
  locationName?: string;
  age?: number;
  isCitizen?: boolean;
  hasVoterId?: boolean;
  zipCode?: string;
}

export interface BotResponse {
  text: string;
  options?: string[];
  requiresUpload?: boolean;
  requiresRegistration?: boolean;
  mapQuery?: string;
  triggerEmail?: boolean;
}

// Local Storage Keys
const DB_KEY = 'smartElectionUsersDB';

export const getLocalDB = () => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveToDB = (user: any) => {
  const db = getLocalDB();
  db.push({ ...user, id: Date.now() });
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const findUserInDB = (name: string) => {
  const db = getLocalDB();
  return db.find((u: any) => u.name?.toLowerCase() === name?.toLowerCase());
};

// Translation map
const translations: Record<string, any> = {
  English: {
    welcome: "Hello {name}! I am your AI Civic Assistant. I can help you understand the election process, track timelines, or find your polling station. What would you like to do?",
    voterId: "Excellent. Do you already possess a valid Voter ID card?",
    registration: "Registration required. Please fill out our secure inline registration portal to proceed.",
    notCitizen: "I'm sorry, you must be a citizen to participate in national elections. Please contact your local embassy for non-citizen rights.",
    locate: "Welcome back! Your record in {location} is verified. Please provide your current Zip Code or Ward number to find your polling station.",
    syncFailed: "Your name wasn't found in our recent synchronization. Please complete a fresh registration to ensure your data is current.",
    complete: "Verification successful! Your designated Polling Station is: {station}.",
    eduStart: "The election process follows these steps: \n1. Notification & Timeline\n2. Voter Registration\n3. Nominations & Campaigning\n4. Polling & Results. \n\nWhich area should we explore?",
    timeline: "Election 2024 is conducted in 7 phases spanning from April to June. Counting happens on June 4th. Would you like to see phase-wise dates?",
  },
  Kannada: {
    welcome: "ನಮಸ್ಕಾರ {name}! ನಾನು ನಿಮ್ಮ AI ನಾಗರಿಕ ಸಹಾಯಕ. ಚುನಾವಣಾ ಪ್ರಕ್ರಿಯೆ, ಸಮಯ ಮತ್ತು ಮತದಾನ ಕೇಂದ್ರಗಳ ಬಗ್ಗೆ ನಾನು ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ. ನೀವು ಏನು ತಿಳಿಯಬಯಸುವಿರಿ?",
    voterId: "ಅತ್ಯುತ್ತಮ. ನಿಮ್ಮ ಬಳಿ ಈಗಾಗಲೇ ಮಾನ್ಯವಾದ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ ಇದೆಯೇ?",
    registration: "ನೋಂದಣಿ ಅಗತ್ಯವಿದೆ. ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ನೋಂದಣಿ ಪೋರ್ಟಲ್ ಭರ್ತಿ ಮಾಡಿ.",
    notCitizen: "ಕ್ಷಮಿಸಿ, ರಾಷ್ಟ್ರೀಯ ಚುನಾವಣೆಗಳಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಲು ನೀವು ಈ ದೇಶದ ಪ್ರಜೆಯಾಗಿರಬೇಕು.",
    locate: "ಮರಳಿ ಸ್ವಾಗತ! {location} ಭಾಗದ ನಿಮ್ಮ ದಾಖಲೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಪೋಲಿಂಗ್ ಕೇಂದ್ರಕ್ಕಾಗಿ ಪಿನ್ ಕೋಡ್ ನೀಡಿ.",
    syncFailed: "ದಾಖಲೆಗಳಲ್ಲಿ ನಿಮ್ಮ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸದಾಗಿ ನೋಂದಣಿ ಮಾಡಿ.",
    complete: "ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ! ನಿಮ್ಮ ಪೋಲಿಂಗ್ ಕೇಂದ್ರ: {station}.",
    eduStart: "ಚುನಾವಣಾ ಪ್ರಕ್ರಿಯೆಯ ಹಂತಗಳು: \n1. ಅಧಿಸೂಚನೆ ಮತ್ತು ಸಮಯ\n2. ಮತದಾರರ ನೋಂದಣಿ\n3. ನಾಮಪತ್ರ ಸಲ್ಲಿಕೆ\n4. ಮತದಾನ ಮತ್ತು ಫಲಿತಾಂಶ.",
    timeline: "2024 ರ ಚುನಾವಣೆ ಏಪ್ರಿಲ್‌ನಿಂದ ಜೂನ್‌ವರೆಗೆ 7 ಹಂತಗಳಲ್ಲಿ ನಡೆಯಲಿದೆ.",
  }
};

const getT = (lang?: string) => translations[lang || 'English'] || translations['English'];

export const getResponse = (message: string, state: ChatState, updateState: (s: Partial<ChatState>) => void): BotResponse => {
  const msg = message.toLowerCase();
  const t = getT(state.language);
  const userName = state.userName || 'Citizen';
  const locationName = state.locationName || 'this area';

  switch (state.step) {
    case 'LANGUAGE':
      const validLangs = ['English', 'Kannada'];
      const selected = validLangs.find(l => l.toLowerCase() === msg);
      
      if (!selected) {
        return {
          text: "Please select your preferred language:",
          options: validLangs
        };
      }

      updateState({ step: 'MAIN_MENU', language: selected });
      const nextT = getT(selected);
      return {
        text: nextT.welcome.replace('{name}', userName),
        options: selected === 'English' 
          ? ['Election Process 101', 'Election Timeline', 'Voter Verification']
          : ['ಚುನಾವಣಾ ಪ್ರಕ್ರಿಯೆ 101', 'ಚುನಾವಣಾ ಸಮಯ', 'ಮತದಾರರ ದೃಢೀಕರಣ']
      };

    case 'MAIN_MENU':
      if (msg.includes('101') || msg.includes('ಪಕ್ರಿಯೆ')) {
        updateState({ step: 'EDUCATION' });
        return {
          text: t.eduStart,
          options: ['Timeline', 'Registration', 'Polling Booth', 'Back']
        };
      }
      if (msg.includes('timeline') || msg.includes('ಸಮಯ')) {
        updateState({ step: 'TIMELINE' });
        return {
          text: t.timeline,
          options: ['Show Phases', 'Back']
        };
      }
      updateState({ step: 'CITIZEN' });
      return {
        text: t.welcome.replace('{name}', userName).replace('{location}', locationName),
        options: ['Yes', 'No']
      };

    case 'EDUCATION':
      if (msg === 'back') {
        updateState({ step: 'MAIN_MENU' });
        return { text: t.welcome.replace('{name}', userName), options: ['Election Process 101', 'Election Timeline', 'Voter Verification'] };
      }
      return {
        text: "Step-by-step guides are available in the 'Guide' tab too! Would you like details on something specific?",
        options: ['Registration', 'Polling Booth', 'Main Menu']
      };

    case 'TIMELINE':
      if (msg === 'back') {
        updateState({ step: 'MAIN_MENU' });
        return { text: t.welcome.replace('{name}', userName), options: ['Election Process 101', 'Election Timeline', 'Voter Verification'] };
      }
      return {
        text: "Phase 1: April 19\nPhase 2: April 26\nPhase 3: May 7\n...\nResults: June 4.",
        options: ['Back']
      };

    case 'CITIZEN':
      if (msg === 'no' || msg === 'ಇಲ್ಲ') {
        updateState({ step: 'COMPLETE' });
        return { text: t.notCitizen };
      }
      updateState({ step: 'VOTER_ID', isCitizen: true });
      return {
        text: t.voterId,
        options: ['Yes', 'No']
      };

    case 'VOTER_ID':
      const hasIdInput = msg === 'yes' || msg === 'ಹೌದು';
      updateState({ hasVoterId: hasIdInput });
      
      if (!hasIdInput) {
        updateState({ step: 'REGISTRATION' });
        return {
          text: t.registration,
          requiresRegistration: true
        };
      } else {
        updateState({ step: 'LOCATE' });
        return {
          text: t.locate.replace('{location}', locationName)
        };
      }

    case 'REGISTRATION':
      return {
        text: t.registration,
        requiresRegistration: true
      };

    case 'LOCATE':
      updateState({ step: 'COMPLETE', zipCode: message });
      const pollingStation = `Community Hub - Sector ${message.slice(0, 2)}`;
      return {
        text: t.complete.replace('{station}', pollingStation),
        mapQuery: `${message} Center`,
        triggerEmail: true
      };

    default:
      return {
        text: "You are all set for the upcoming elections. Is there anything else you need help with?",
        options: ['Help', 'Restart']
      };
  }
};
