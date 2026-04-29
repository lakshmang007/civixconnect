
/**
 * Smart Election Assistant Logic - Pure State Machine
 */

export interface ChatState {
  step: 'LANGUAGE' | 'CITIZEN' | 'VOTER_ID' | 'REGISTRATION' | 'LOCATE' | 'COMPLETE';
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
    welcome: "Hello {name}! As a member of {location}, I'm here to assist you with your national election requirements. Are you a legal citizen?",
    voterId: "Excellent. Do you already possess a valid Voter ID card?",
    registration: "Registration required. Please fill out our secure inline registration portal to proceed.",
    notCitizen: "I'm sorry, you must be a citizen to participate in national elections. Please contact your local embassy for non-citizen rights.",
    locate: "Welcome back! Your record in {location} is verified. Please provide your current Zip Code or Ward number to find your polling station.",
    syncFailed: "Your name wasn't found in our recent synchronization. Please complete a fresh registration to ensure your data is current.",
    complete: "Verification successful! Your designated Polling Station is: {station}."
  },
  Kannada: {
    welcome: "ನಮಸ್ಕಾರ {name}! {location} ನಿವಾಸಿಯಾಗಿ, ರಾಷ್ಟ್ರೀಯ ಚುನಾವಣೆಯ ಬಗ್ಗೆ ನಿಮಗೆ ವಿವರ ನೀಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ನೀವು ಕಾನೂನುಬದ್ಧ ಪ್ರಜೆಯೇ?",
    voterId: "ಅತ್ಯುತ್ತಮ. ನಿಮ್ಮ ಬಳಿ ಈಗಾಗಲೇ ಮಾನ್ಯವಾದ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ ಇದೆಯೇ?",
    registration: "ನೋಂದಣಿ ಅಗತ್ಯವಿದೆ. ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ನೋಂದಣಿ ಪೋರ್ಟಲ್ ಭರ್ತಿ ಮಾಡಿ.",
    notCitizen: "ಕ್ಷಮಿಸಿ, ರಾಷ್ಟ್ರೀಯ ಚುನಾವಣೆಗಳಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಲು ನೀವು ಈ ದೇಶದ ಪ್ರಜೆಯಾಗಿರಬೇಕು.",
    locate: "ಮರಳಿ ಸ್ವಾಗತ! {location} ಭಾಗದ ನಿಮ್ಮ ದಾಖಲೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಪೋಲಿಂಗ್ ಕೇಂದ್ರಕ್ಕಾಗಿ ಪಿನ್ ಕೋಡ್ ನೀಡಿ.",
    syncFailed: "ದಾಖಲೆಗಳಲ್ಲಿ ನಿಮ್ಮ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸದಾಗಿ ನೋಂದಣಿ ಮಾಡಿ.",
    complete: "ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ! ನಿಮ್ಮ ಪೋಲಿಂಗ್ ಕೇಂದ್ರ: {station}."
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

      updateState({ step: 'CITIZEN', language: selected });
      const nextT = getT(selected);
      return {
        text: nextT.welcome.replace('{name}', userName).replace('{location}', locationName),
        options: ['Yes', 'No']
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
