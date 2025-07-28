// Chain logo imports
import walmartLogo from '@/assets/logos/walmart.png';
import targetLogo from '@/assets/logos/target.png';
import krogerLogo from '@/assets/logos/kroger.png';

// Chain logo mapping utility
export const chainLogos: Record<string, string> = {
  'Walmart': walmartLogo,
  'Target': targetLogo,
  'Kroger': krogerLogo,
  // Add more logos as they become available
};

export const getChainLogo = (chainName: string): string | null => {
  return chainLogos[chainName] || null;
};

export const getChainInitial = (chainName: string): string => {
  return chainName.charAt(0).toUpperCase();
};