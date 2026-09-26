import React from 'react';

export interface CompanyLogoProps {
  className?: string;
  height?: number;
  width?: number;
}

// 1. Google Full Multi-Color Logo
export const GoogleLogo: React.FC<CompanyLogoProps> = ({ height = 28 }) => (
  <svg height={height} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Google">
    {/* G */}
    <path d="M19.5 20.3c0-.8-.1-1.6-.2-2.3H10v4.4h5.3c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.9 3.1-4.7 3.1-7.8z" fill="#4285F4"/>
    <path d="M10 30c2.7 0 5-1 6.7-2.6l-3.4-2.6c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.8-5.6-4.2H1V24.3C2.8 27.8 6.1 30 10 30z" fill="#34A853"/>
    <path d="M4.4 21.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V15H1C.3 16.4 0 18.2 0 20s.4 3.6 1 5l3.4-2.6c0-.3 0-.5 0-.8z" fill="#FBBC05"/>
    <path d="M10 13.6c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 10.6 12.7 9.6 10 9.6 6.1 9.6 2.8 11.8 1 15.3l3.4 2.6c.8-2.4 3-4.3 5.6-4.3z" fill="#EA4335"/>
    {/* o */}
    <path d="M28 20c0-3.3-2.5-5.8-5.7-5.8s-5.7 2.5-5.7 5.8 2.5 5.8 5.7 5.8 5.7-2.5 5.7-5.8zm-2.5 0c0 2.1-1.5 3.6-3.2 3.6-1.8 0-3.2-1.5-3.2-3.6 0-2.1 1.5-3.6 3.2-3.6 1.7 0 3.2 1.5 3.2 3.6z" fill="#EA4335"/>
    {/* o */}
    <path d="M41 20c0-3.3-2.5-5.8-5.7-5.8s-5.7 2.5-5.7 5.8 2.5 5.8 5.7 5.8 5.7-2.5 5.7-5.8zm-2.5 0c0 2.1-1.5 3.6-3.2 3.6-1.8 0-3.2-1.5-3.2-3.6 0-2.1 1.5-3.6 3.2-3.6 1.7 0 3.2 1.5 3.2 3.6z" fill="#FBBC05"/>
    {/* g */}
    <path d="M53.5 14.5v10.4c0 4.3-2.5 6-5.5 6-2.8 0-4.5-1.9-5.1-3.4l2.2-.9c.4 1 1.5 2.1 2.9 2.1 1.9 0 3.1-1.2 3.1-3.4v-.8h-.1c-.6.8-1.8 1.5-3.2 1.5-3 0-5.6-2.6-5.6-5.9s2.6-5.8 5.6-5.8c1.5 0 2.6.7 3.2 1.4h.1v-1.1h2.4zm-2.3 5.5c0-2-1.3-3.6-3.1-3.6-1.8 0-3.1 1.5-3.1 3.6 0 2 1.3 3.5 3.1 3.5 1.7 0 3.1-1.5 3.1-3.5z" fill="#4285F4"/>
    {/* l */}
    <path d="M58 9.5v16.1h-2.5V9.5H58z" fill="#34A853"/>
    {/* e */}
    <path d="M68.5 22.1l2 1.3c-.6 1-2.2 2.8-5 2.8-3.5 0-6.1-2.7-6.1-5.9 0-3.5 2.6-5.8 5.8-5.8 3.5 0 5.2 2.4 5.7 3.7l.3.8-8.8 3.6c.7 1.4 1.8 2.1 3.3 2.1 1.6 0 2.6-.8 3.3-1.8zm-6.2-2.3l5.9-2.4c-.3-.8-1.3-1.4-2.4-1.4-1.5 0-3.2 1.3-3.5 3.8z" fill="#EA4335"/>
  </svg>
);

// 2. Microsoft Official 4-Color Grid Logo
export const MicrosoftLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Microsoft">
    <rect x="0" y="4" width="11" height="11" fill="#F25022"/>
    <rect x="13" y="4" width="11" height="11" fill="#7FBA00"/>
    <rect x="0" y="17" width="11" height="11" fill="#00A4EF"/>
    <rect x="13" y="17" width="11" height="11" fill="#FFB900"/>
    <text x="32" y="21" fontFamily="-apple-system, 'Segoe UI', Roboto, sans-serif" fontSize="16" fontWeight="600" fill="#334155" letterSpacing="-0.5px">
      Microsoft
    </text>
  </svg>
);

// 3. Amazon Official Logo with Curved Arrow Smile
export const AmazonLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 110 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Amazon">
    <text x="0" y="20" fontFamily="-apple-system, BlinkMacSystemFont, 'Amazon Ember', Roboto, sans-serif" fontSize="20" fontWeight="800" fill="#0f172a" letterSpacing="-1px">
      amazon
    </text>
    {/* Iconic smile arrow */}
    <path d="M12 25c22 8 52 4 68-7" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M78 15c2.5 3 4 5 4.5 5.5s-2.5 2-4 3" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="#FF9900"/>
  </svg>
);

// 4. Razorpay Official Angular 'R' + Typography Logo
export const RazorpayLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Razorpay">
    {/* Razor icon */}
    <path d="M6 3L17 3L11 15L20 15L7 29L10 18L3 18L6 3Z" fill="#0C2340"/>
    <path d="M11 15L17 3L6 3L11 15Z" fill="#3395FF"/>
    <text x="28" y="21" fontFamily="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" fontSize="17" fontWeight="800" fill="#0C2340" letterSpacing="-0.5px">
      Razorpay
    </text>
  </svg>
);

// 5. Paytm Official Two-Tone Blue Logo
export const PaytmLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Paytm">
    <text x="2" y="22" fontFamily="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" fontSize="22" fontWeight="900" fill="#002E6E" letterSpacing="-1px">
      Pay
    </text>
    <text x="44" y="22" fontFamily="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" fontSize="22" fontWeight="900" fill="#00BAF2" letterSpacing="-1px">
      tm
    </text>
  </svg>
);

// 6. Flipkart Iconic Logo (Blue & Yellow Shopping Bag + 'f')
export const FlipkartLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Flipkart">
    {/* Yellow shopping bag */}
    <rect x="2" y="4" width="22" height="24" rx="4" fill="#2874F0"/>
    <path d="M7 4V2a4 4 0 0 1 8 0v2" stroke="#FFE11B" strokeWidth="2" strokeLinecap="round"/>
    <text x="9" y="21" fontFamily="Impact, Arial Black, sans-serif" fontSize="17" fontWeight="900" fontStyle="italic" fill="#FFE11B">
      f
    </text>
    <text x="32" y="21" fontFamily="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" fontSize="17" fontWeight="800" fontStyle="italic" fill="#2874F0" letterSpacing="-0.5px">
      Flipkart
    </text>
  </svg>
);

// 7. CRED Iconic Geometric Shield Logo
export const CredLogo: React.FC<CompanyLogoProps> = ({ height = 24 }) => (
  <svg height={height} viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CRED">
    {/* Geometric stylized CRED shield */}
    <path d="M4 4h18v14c0 5-4 9-9 9s-9-4-9-9V4z" fill="#0f172a" />
    <path d="M8 8h10v10c0 3-2 5-5 5s-5-2-5-5V8z" fill="#ffffff" />
    <path d="M11 11h4v7c0 1-.8 2-2 2s-2-1-2-2v-7z" fill="#0f172a" />
    <text x="30" y="21" fontFamily="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" fontSize="17" fontWeight="900" fill="#0f172a" letterSpacing="2px">
      CRED
    </text>
  </svg>
);

// 8. Zomato Official Red Typography Logo
export const ZomatoLogo: React.FC<CompanyLogoProps> = ({ height = 24 }) => (
  <svg height={height} viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Zomato">
    <rect x="0" y="2" width="108" height="28" rx="8" fill="#E23744" />
    <text x="12" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Trebuchet MS', sans-serif" fontSize="18" fontWeight="900" fontStyle="italic" fill="#ffffff" letterSpacing="0.5px">
      zomato
    </text>
  </svg>
);

// 9. Swiggy Official Orange Logo
export const SwiggyLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 115 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Swiggy">
    {/* Swiggy Orange Pin */}
    <path d="M12 2C6.5 2 2 6.5 2 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.5-4.5-10-10-10zm-1 6a3 3 0 1 1 2 5.5l-3 4.5h6" fill="#FC8019"/>
    <text x="28" y="22" fontFamily="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" fontSize="18" fontWeight="800" fill="#FC8019" letterSpacing="-0.5px">
      SWIGGY
    </text>
  </svg>
);

// 10. Infosys Official Blue Logo
export const InfosysLogo: React.FC<CompanyLogoProps> = ({ height = 24 }) => (
  <svg height={height} viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Infosys">
    <text x="2" y="21" fontFamily="-apple-system, BlinkMacSystemFont, Arial, sans-serif" fontSize="19" fontWeight="800" fill="#007CC3" letterSpacing="-0.5px">
      Infosys
    </text>
  </svg>
);

// 11. TCS Official Modern Logo
export const TcsLogo: React.FC<CompanyLogoProps> = ({ height = 26 }) => (
  <svg height={height} viewBox="0 0 90 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="TCS">
    <text x="2" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif" fontSize="20" fontWeight="900" fill="#0F172A" letterSpacing="1px">
      TCS
    </text>
    <rect x="52" y="7" width="30" height="17" rx="3" fill="#2563EB" />
    <text x="56" y="19" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="9" fontWeight="800" fill="#ffffff">
      TATA
    </text>
  </svg>
);

// 12. Uber Official Logo
export const UberLogo: React.FC<CompanyLogoProps> = ({ height = 24 }) => (
  <svg height={height} viewBox="0 0 85 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Uber">
    <text x="2" y="21" fontFamily="-apple-system, BlinkMacSystemFont, 'Uber MoveText', Roboto, sans-serif" fontSize="21" fontWeight="800" fill="#0f172a" letterSpacing="-0.5px">
      Uber
    </text>
  </svg>
);

export const ALL_COMPANY_LOGOS = [
  { name: 'Google', Component: GoogleLogo },
  { name: 'Microsoft', Component: MicrosoftLogo },
  { name: 'Amazon', Component: AmazonLogo },
  { name: 'Paytm', Component: PaytmLogo },
  { name: 'CRED', Component: CredLogo },
  { name: 'Zomato', Component: ZomatoLogo },
  { name: 'Flipkart', Component: FlipkartLogo },
  { name: 'Razorpay', Component: RazorpayLogo },
  { name: 'Swiggy', Component: SwiggyLogo },
  { name: 'Infosys', Component: InfosysLogo },
  { name: 'TCS', Component: TcsLogo },
  { name: 'Uber', Component: UberLogo },
];
