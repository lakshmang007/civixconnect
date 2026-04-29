import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'kn' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    kn: string;
    hi: string;
  };
}

export const translations: Translations = {
  // App Name
  appName: { en: 'CivixConnect', kn: 'ಸಿವಿಕ್ಸ್ ಕನೆಕ್ಟ್', hi: 'सिविक्स कनेक्ट' },
  appTagline: { en: 'Civic engagement platform', kn: 'ನಾಗರಿಕ ಸಹಭಾಗಿತ್ವ ವೇದಿಕೆ', hi: 'नागरिक जुड़ाव मंच' },
  
  // Sidebar
  communityFeed: { en: 'Community Feed', kn: 'ಸಮುದಾಯ ಫೀಡ್', hi: 'सामुदायिक फ़ीड' },
  authorityDirectory: { en: 'Authority Directory', kn: 'ಅಧಿಕಾರಿಗಳ ವಿವರ', hi: 'प्राधिकारी निर्देशिका' },
  myIssues: { en: 'My Reported Issues', kn: 'ನನ್ನ ದೂರುಗಳು', hi: 'मेरी समस्याएँ' },
  voterGuide: { en: 'Voter Guide', kn: 'ಮತದಾರರ ಮಾರ್ಗದರ್ಶಿ', hi: 'मतदाता मार्गदर्शिका' },
  terminateSession: { en: 'Terminate Session', kn: 'ಸೈನ್ ಔಟ್ ಮಾಡಿ', hi: 'सत्र समाप्त करें' },
  zip: { en: 'Zip', kn: 'ಪಿನ್ ಕೋಡ್', hi: 'पिन कोड' },

  // Header
  searchPlaceholder: { en: 'All Locations / Zip Codes', kn: 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು / ಪಿನ್ ಕೋಡ್', hi: 'सभी स्थान / पिन कोड' },
  onlineStats: { en: 'Online: 1,204 Active', kn: 'ಸಕ್ರಿಯ: 1,204 ಸಕ್ರಿಯ', hi: 'ऑनलाइन: 1,204 सक्रिय' },
  area: { en: 'Area', kn: 'ಪ್ರದೇಶ', hi: 'क्षेत्र' },

  // Feed
  priorityFeed: { en: 'Priority Community Feed', kn: 'ಮುಖ್ಯ ಸಮುದಾಯ ಫೀಡ್', hi: 'प्राथमिकता सामुदायिक फ़ीड' },
  latest: { en: 'Latest', kn: 'ಹೊಸದು', hi: 'नवीनतम' },
  trending: { en: 'Trending', kn: 'ಟ್ರೆಂಡಿಂಗ್', hi: 'प्रचलित' },
  noIssues: { en: 'No issues found', kn: 'ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ', hi: 'कोई समस्या नहीं मिली' },
  beFirst: { en: 'Be the first to report something!', kn: 'ದೂರು ನೀಡುವಲ್ಲಿ ಮೊದಲಿಗರಾಗಿ!', hi: 'रिपोर्ट करने वाले पहले व्यक्ति बनें!' },

  // Card
  support: { en: 'Support', kn: 'ಬೆಂಬಲಿಸಿ', hi: 'समರ್ಥन' },
  supported: { en: 'Supported', kn: 'ಬೆಂಬಲಿಸಲಾಗಿದೆ', hi: 'समर्थित' },
  reported: { en: 'Reported', kn: 'ವರದಿ ಮಾಡಲಾಗಿದೆ', hi: 'रिपोर्ट किया गया' },
  verifiedResident: { en: 'Verified Resident', kn: 'ದೃಢೀಕೃತ ನಿವಾಸಿ', hi: 'सत्यापित निवासी' },
  aiEscalation: { en: 'AI Escalation Success', kn: 'AI ಸಫಲವಾಗಿದೆ', hi: 'AI इज़ाफ़ा सफल' },

  // Modal
  reportIssue: { en: 'Report a Community Issue', kn: 'ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ', hi: 'सामुदायिक समस्या की रिपोर्ट करें' },
  uploadDetails: { en: 'Upload Details & Photos', kn: 'ವಿವರಗಳು ಮತ್ತು ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', hi: 'विवरण और फोटो अपलोड करें' },
  uploadFromDevice: { en: 'Upload from Device', kn: 'ಸಾಧನದಿಂದ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', hi: 'डिवाइस से अपलोड करें' },
  imageAttached: { en: 'Image Attached', kn: 'ಚಿತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ', hi: 'छवि संलग्न है' },
  samplePhoto: { en: 'Sample Photo', kn: 'ಮಾದರಿ ಫೋಟೋ', hi: 'नमूना फोटो' },
  issueCategory: { en: 'Issue Category', kn: 'ಸಮಸ್ಯೆಯ ವರ್ಗ', hi: 'समस्या श्रेणी' },
  locationZip: { en: 'Location / Zip Code', kn: 'ಸ್ಥಳ / ಪಿನ್ ಕೋಡ್', hi: 'स्थान / पिन कोड' },
  headline: { en: 'Headline', kn: 'ಶೀರ್ಷಿಕೆ', hi: 'मुख्य समाचार' },
  detailsContext: { en: 'Location Details & Context', kn: 'ಸ್ಥಳದ ವಿವರ ಮತ್ತು ವಿಷಯ', hi: 'स्थान विवरण और संदर्भ' },
  submit: { en: 'Submit for Community Validation', kn: 'ದೃಢೀಕರಣಕ್ಕಾಗಿ ಸಲ್ಲಿಸಿ', hi: 'सामुदायिक सत्यापन के लिए जमा करें' },

  loading: { en: 'Loading...', kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', hi: 'लोड हो रहा है...' },
  status: { en: 'Status', kn: 'ಸ್ಥಿತಿ', hi: 'स्थिति' },
  resolutionLedger: { en: 'Resolution Ledger', kn: 'ರೆಸಲ್ಯೂಶನ್ ಲೆಡ್ಜರ್', hi: 'समाधान बही' },

  // Voting Guide
  votingGuide: { en: 'Voter Registration Guide', kn: 'ಮತದಾನದ ನೋಂದಣಿ ಮಾರ್ಗದರ್ಶಿ', hi: 'मतदाता पंजीकरण मार्गदर्शिका' },
  guideStep1: { en: 'Check name in Electoral Roll', kn: 'ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ', hi: 'मतदाता सूची में नाम जांचें' },
  guideStep2: { en: 'Register using Form 6 if new', kn: 'ಹೊಸಬರಾಗಿದ್ದರೆ ಫಾರ್ಮ್ 6 ಬಳಸಿ ನೋಂದಾಯಿಸಿ', hi: 'नये होने पर फॉर्म 6 का उपयोग करके पंजीकरण करें' },
  guideStep3: { en: 'Locate your polling booth', kn: 'ನಿಮ್ಮ ಮತದಾನ ಕೇಂದ್ರವನ್ನು ಗುರುತಿಸಿ', hi: 'अपने मतदान केंद्र का पता लगाएं' },
  guideStepGov: { en: 'Identify your Candidates', kn: 'ನಿಮ್ಮ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಗುರುತಿಸಿ', hi: 'अपने उम्मीदवारों की पहचान करें' },
  guideStep4: { en: 'Carry Voter ID on Election Day', kn: 'ಚುನಾವಣಾ ದಿನದಂದು ಮತದಾನದ ಗುರುತಿನ ಚೀಟಿ ತನ್ನಿ', hi: 'चुनाव के दिन वोटर आईडी साथ रखें' },
  
  // At the Booth
  atBoothTitle: { en: 'At the Polling Booth', kn: 'ಮತದಾನ ಕೇಂದ್ರದಲ್ಲಿ', hi: 'मतदान केंद्र पर' },
  boothStep1: { en: 'First official checks your name on list and checks ID proof', kn: 'ಮೊದಲ ಅಧಿಕಾರಿ ನಿಮ್ಮ ಐಡಿ ಮತ್ತು ಹೆಸರನ್ನು ಪಟ್ಟಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸುತ್ತಾರೆ', hi: 'पहला मतदान अधिकारी आपकी आईडी और सूची में नाम की जांच करता है' },
  boothStep2: { en: 'Second official inks finger, gives slip & takes signature (Form 17A)', kn: 'ಎರಡನೇ ಅಧಿಕಾರಿ ಬೆರಳಿಗೆ ಶಾಯಿ ಹಚ್ಚುತ್ತಾರೆ ಮತ್ತು ಸಹಿ ಪಡೆಯುತ್ತಾರೆ (ಫಾರ್ಮ್ 17A)', hi: 'दूसरा अधिकारी उंगली पर स्याही लगाता है, पर्ची देता है और हस्ताक्षर लेता है (फॉर्म 17A)' },
  boothStep3: { en: 'Third official checks slip & enables the EVM; डिपॉजिट स्लिप', kn: 'ಮೂರನೇ ಅಧಿಕಾರಿ ಸ್ಲಿಪ್ ಪರಿಶೀಲಿಸುತ್ತಾರೆ ಮತ್ತು EVM ಸಕ್ರಿಯಗೊಳಿಸುತ್ತಾರೆ', hi: 'तीसरा अधिकारी पर्ची की जांच करता है और ईवीएम को सक्षम करता है' },
  boothStep4: { en: 'Press button for your candidate on EVM; Hear the beep', kn: 'ನಿಮ್ಮ ಅಭ್ಯರ್ಥಿಯ ಬಟನ್ ಒತ್ತಿರಿ; ಬೀಪ್ ಸೌಂಡ್ ಕೇಳಿಸಿಕೊಳ್ಳಿ', hi: 'ईवीएम पर अपने उम्मीदवार के लिए बटन दबाएं; बीप की आवाज सुनें' },
  boothStep5: { en: 'Check VVPAT slip for 7 seconds to verify vote symbol', kn: 'ಮತ ದೃಢೀಕರಿಸಲು 7 ಸೆಕೆಂಡುಗಳ ಕಾಲ VVPAT ಸ್ಲಿಪ್ ಪರಿಶೀಲಿಸಿ', hi: 'वोट सत्यापित करने के लिए 7 सेकंड के लिए वीवीपीएटी पर्ची की जांच करें' },
  boothStep6: { en: 'You can press NOTA (last button) if you don\'t like any candidate', kn: 'ಯಾವ ಅಭ್ಯರ್ಥಿಯೂ ಇಷ್ಟವಾಗದಿದ್ದರೆ ನೀವು NOTA ಒತ್ತಬಹುದು', hi: 'यदि आपको कोई उम्मीदवार पसंद नहीं है तो आप नोटा दबा सकते हैं' },

  // New Voting Sections
  idProofTitle: { en: 'Accepted Identity Documents', kn: 'ಅಂಗೀಕೃತ ಗುರುತಿನ ಚೀಟಿಗಳು', hi: 'स्वीकृत पहचान दस्तावेज' },
  idProofNotice: { en: 'Carry any one of these 12 recognized IDs. Photo Voter Slip alone is not sufficient.', kn: 'ಈ 12 ಗುರುತಿನ ಚೀಟಿಗಳಲ್ಲಿ ಒಂದನ್ನು ತನ್ನಿ.', hi: 'इन 12 मान्यता प्राप्त आईडी में से कोई भी एक साथ रखें।' },
  phaseTitle: { en: 'Election Calendar (2024)', kn: 'ಚುನಾವಣಾ ವೇಳಾಪಟ್ಟಿ (2024)', hi: 'चुनाव कैलेंडर (2024)' },
  prohibitionWarning: { en: 'Mobile phones & cameras are STRICTLY PROHIBITED inside.', kn: 'ಮೊಬೈಲ್ ಫೋನ್ ಮತ್ತು ಕ್ಯಾಮೆರಾಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ.', hi: 'मोबाइल फोन और कैमरे अंदर सख्त वर्जित हैं।' },
  topActions: { en: 'Top Actions', kn: 'ಮುಖ್ಯ ಕ್ರಮಗಳು', hi: 'शीर्ष कार्रवाइयाँ' },
  whereToVote: { en: 'Where to Vote', kn: 'ಎಲ್ಲಿ ಮತದಾನ ಮಾಡಬೇಕು', hi: 'कहाँ वोट करें' },
  knowYourCandidate: { en: 'Know Your Candidate', kn: 'ನಿಮ್ಮ ಅಭ್ಯರ್ಥಿಯನ್ನು ತಿಳಿಯಿರಿ', hi: 'अपने उम्मीदवार को जानें' },
  verifyStatus: { en: 'Check Registration Status', kn: 'ನೋಂದಣಿ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ', hi: 'पंजीकरण स्थिति की जांच करें' },

  learnMoreGov: { en: 'Visit Official Gov Portal', kn: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ', hi: 'आधिकारिक सरकारी पोर्टल पर जाएं' },
  voterDisclaimer: { en: 'Information based on ECI guidelines. Please verify on official channels.', kn: 'ECI ಮಾರ್ಗಸೂಚಿಗಳ ಆಧಾರದ ಮೇಲೆ ಮಾಹಿತಿ. ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಚಾನಲ್‌ಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.', hi: 'ईसीआई दिशानिर्देशों पर आधारित जानकारी। कृपया आधिकारिक चैनलों पर सत्यापित करें।' },

  // Chat
  civicAssistant: { en: 'Civic Assistant', kn: 'ನಾಗರಿಕ ಸಹಾಯಕ', hi: 'नागरिक सहायक' },
  chatPlaceholder: { en: 'Ask about civic issues...', kn: 'ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ...', hi: 'नागरिक समस्याओं के बारे में पूछें...' },
  voiceActive: { en: 'Listening...', kn: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ...', hi: 'सुन रहा है...' },
  aiTyping: { en: 'Assistant is thinking...', kn: 'ಸಹಾಯಕ ಯೋಚಿಸುತ್ತಿದ್ದಾನೆ...', hi: 'सहायक सोच रहा है...' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
