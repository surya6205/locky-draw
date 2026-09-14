export interface Participant {
  id: string;
  drawNumber: string; // e.g. "001", "002"
  sequenceNumber: number; // 1, 2, ...
  fullName: string;
  fatherName: string;
  motherName: string;
  mobile: string; // 10 digits
  location: string;
  compositeKey: string; // lowercase fullName_fatherName_motherName_mobile
  createdAt: string; // ISO string
}

export interface MobileTracker {
  mobile: string;
  count: number;
  participantIds: string[];
  updatedAt: string;
}

export interface DrawWinner {
  id: string;
  drawNumber: string;
  participantId: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  location: string;
  prize: string;
  wonAt: string;
  scratchRevealed: boolean;
  position?: number; // 1 for 1st Prize, 2 for 2nd Prize, 3 for 3rd Prize
}

export interface DrawConfig {
  currentSequence: number;
  registrationLocked: boolean;
  drawLocked: boolean;
  updatedAt: string;
}

export const ORGANIZER_INFO = {
  name: 'DHARMALABH SAUBHAGYA DRAW',
  nameHindi: 'धर्मलाभ सौभाग्य ड्रॉ',
  organizer: 'Manish Jain',
  primaryPhone: '+91 83868 62130',
  secondaryPhones: ['9782162010', '8386862130'],
  email: 'manish.jain8619@gmail.com',
  address: '3 New Colony, Near Panchayat Samithi, Jhotwara, Jaipur 325185',
  city: 'Jaipur, Rajasthan',
  pincode: '325185',
} as const;

export const POPULAR_LOCATIONS = [
  'Jhotwara, Jaipur',
  '3 New Colony, Jhotwara, Jaipur',
  'Panchayat Samithi, Jhotwara, Jaipur',
  'Khatipura, Jaipur',
  'Vaishali Nagar, Jaipur',
  'Mansarovar, Jaipur',
  'Malviya Nagar, Jaipur',
  'Vidhyadhar Nagar, Jaipur',
  'Bani Park, Jaipur',
  'C-Scheme, Jaipur',
  'Raja Park, Jaipur',
  'Sanganer, Jaipur',
  'Tonk Road, Jaipur',
  'Ajmer Road, Jaipur',
  'Sodala, Jaipur',
  'Murlipura, Jaipur',
  'Chomu, Jaipur',
  'Amer, Jaipur',
  'Sitapura, Jaipur',
  'Jagatpura, Jaipur',
  'Pratap Nagar, Jaipur',
  'Ajmer, Rajasthan',
  'Kota, Rajasthan',
  'Jodhpur, Rajasthan',
  'Udaipur, Rajasthan',
  'Bikaner, Rajasthan',
  'Alwar, Rajasthan',
  'Bhilwara, Rajasthan',
  'Sikar, Rajasthan',
  'Churu, Rajasthan',
  'Pali, Rajasthan',
  'Bharatpur, Rajasthan',
  'Beawar, Rajasthan',
  'Jhunjhunu, Rajasthan',
  'Kishangarh, Rajasthan',
  'Nagaur, Rajasthan',
  'Delhi NCR',
  'Mumbai, Maharashtra',
  'Ahmedabad, Gujarat',
  'Indore, Madhya Pradesh',
  'Surat, Gujarat',
];
