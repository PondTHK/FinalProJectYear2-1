import db from 'thai-address-database/database/db.json';

interface AddressEntry {
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
}

// JQL-like preprocessing logic adapted from thai-address-database
const preprocess = (data: any): AddressEntry[] => {
  let lookup: string[] = [];
  let words: string[] = [];
  let expanded: AddressEntry[] = [];
  let useLookup = false;

  if (data.lookup && data.words) {
    useLookup = true;
    lookup = data.lookup.split('|');
    words = data.words.split('|');
    data = data.data;
  }

  const t = (text: string | number): string => {
    function repl(m: string) {
      const ch = m.charCodeAt(0);
      return words[ch < 97 ? ch - 65 : 26 + ch - 97];
    }
    if (!useLookup) {
      return text as string;
    }
    if (typeof text === 'number') {
      text = lookup[text];
    }
    return (text as string).replace(/[A-Z]/ig, repl);
  };

  if (!data[0].length) {
    return data;
  }

  data.map((provinces: any[]) => {
    let i = 1;
    if (provinces.length === 3) {
      i = 2;
    }

    provinces[i].map((amphoes: any[]) => {
      amphoes[i].map((districts: any[]) => {
        districts[i] = districts[i] instanceof Array ? districts[i] : [districts[i]];
        districts[i].map((zipcode: any) => {
          const entry: AddressEntry = {
            district: t(districts[0]),
            amphoe: t(amphoes[0]),
            province: t(provinces[0]),
            zipcode: `${zipcode}`
          };
          expanded.push(entry);
        });
      });
    });
  });

  return expanded;
};

// Preprocess data once
const addresses = preprocess(db);

// Get unique provinces
export const getProvinces = (): string[] => {
  const provinces = new Set(addresses.map(a => a.province));
  return Array.from(provinces).sort();
};

// Get amphoes by province
export const getAmphoes = (province: string): string[] => {
  const amphoes = new Set(
    addresses
      .filter(a => a.province === province)
      .map(a => a.amphoe)
  );
  return Array.from(amphoes).sort();
};

// Get districts (tambons) by province and amphoe
export const getDistricts = (province: string, amphoe: string): string[] => {
  const districts = new Set(
    addresses
      .filter(a => a.province === province && a.amphoe === amphoe)
      .map(a => a.district)
  );
  return Array.from(districts).sort();
};

// Get zipcode by province, amphoe, and district
// Returns the first match found (usually unique for P/A/D combination, but sometimes multiple zipcodes exist for a district? 
// Actually, in Thailand, one Tambon usually has one Zipcode, but let's handle potential multiple by returning one or first)
export const getZipcode = (province: string, amphoe: string, district: string): string => {
  const entry = addresses.find(
    a => a.province === province && a.amphoe === amphoe && a.district === district
  );
  return entry ? entry.zipcode : '';
};

