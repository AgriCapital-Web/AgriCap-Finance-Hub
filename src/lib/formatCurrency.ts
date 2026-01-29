/**
 * Formatte un montant en FCFA selon le format Côte d'Ivoire
 * Utilise l'espace comme séparateur de milliers
 */
export const formatCurrencyCIV = (amount: number): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(amount) + ' FCFA';
};

/**
 * Formatte un montant en version compacte (ex: 1.5M FCFA)
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1).replace('.', ',')} Mds FCFA`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace('.', ',')} M FCFA`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.', ',')} k FCFA`;
  }
  return formatCurrencyCIV(amount);
};

/**
 * Formatte une date au format français complet
 */
export const formatDateFR = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

/**
 * Formatte une date au format court (JJ/MM/AAAA)
 */
export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/**
 * Formatte un pourcentage
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals).replace('.', ',')} %`;
};

/**
 * Convertit un montant en lettres (français)
 */
export const amountToWords = (amount: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  const convertHundreds = (n: number): string => {
    if (n === 0) return '';
    
    let result = '';
    
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      if (hundreds === 1) {
        result += 'cent ';
      } else {
        result += units[hundreds] + ' cent ';
      }
      n %= 100;
    }
    
    if (n >= 10 && n <= 19) {
      result += teens[n - 10];
    } else if (n >= 20) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      
      if (ten === 7 || ten === 9) {
        if (unit === 1 && ten === 7) {
          result += 'soixante et onze';
        } else {
          result += tens[ten] + '-' + teens[unit];
        }
      } else {
        result += tens[ten];
        if (unit === 1 && ten !== 8) {
          result += ' et un';
        } else if (unit > 0) {
          result += '-' + units[unit];
        } else if (ten === 8) {
          result += 's';
        }
      }
    } else if (n > 0) {
      result += units[n];
    }
    
    return result.trim();
  };
  
  if (amount === 0) return 'zéro';
  
  let result = '';
  const billions = Math.floor(amount / 1000000000);
  const millions = Math.floor((amount % 1000000000) / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remainder = amount % 1000;
  
  if (billions > 0) {
    result += convertHundreds(billions) + ' milliard';
    if (billions > 1) result += 's';
    result += ' ';
  }
  
  if (millions > 0) {
    result += convertHundreds(millions) + ' million';
    if (millions > 1) result += 's';
    result += ' ';
  }
  
  if (thousands > 0) {
    if (thousands === 1) {
      result += 'mille ';
    } else {
      result += convertHundreds(thousands) + ' mille ';
    }
  }
  
  if (remainder > 0) {
    result += convertHundreds(remainder);
  }
  
  return result.trim();
};
