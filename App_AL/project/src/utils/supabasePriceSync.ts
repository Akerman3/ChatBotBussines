import { supabase, supabaseAvailable } from './supabaseClient';

export interface ProfilePrice {
  name: string;
  color: string;
  price_6m: number;
  price_per_m: number;
}

export interface HardwarePrice {
  name: string;
  price_per_package: number;
  price_per_piece: number;
}

export interface GlassPrice {
  name: string;
  price_per_piece: number;
  price_per_m2: number;
}

export interface PriceChangeRecord {
  item_type: 'profile' | 'hardware' | 'glass';
  item_name: string;
  item_color?: string;
  field_changed: string;
  old_value: number;
  new_value: number;
  changed_at: string;
}

const TABLES_INITIALIZED_KEY = 'supabase_price_tables_initialized';

async function ensureTablesExist(): Promise<boolean> {
  if (!supabaseAvailable) return false;

  const initialized = localStorage.getItem(TABLES_INITIALIZED_KEY);
  if (initialized === 'true') return true;

  try {
    const { error: profileError } = await supabase
      .from('price_profiles')
      .select('id')
      .limit(1);

    if (profileError) {
      console.warn('⚠️ Supabase price tables not available yet:', profileError.message);
      return false;
    }

    localStorage.setItem(TABLES_INITIALIZED_KEY, 'true');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not verify Supabase tables:', error);
    return false;
  }
}

export async function syncProfilesToSupabase(profiles: any[]): Promise<boolean> {
  if (!supabaseAvailable) return false;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return false;

  try {
    const flatProfiles: ProfilePrice[] = [];

    profiles.forEach(profile => {
      Object.entries(profile.colors).forEach(([color, prices]: [string, any]) => {
        if (prices.price6m || prices.pricePerM) {
          flatProfiles.push({
            name: profile.name,
            color: color,
            price_6m: parseFloat(prices.price6m || '0'),
            price_per_m: parseFloat(prices.pricePerM || '0')
          });
        }
      });
    });

    for (const profile of flatProfiles) {
      const { error } = await supabase
        .from('price_profiles')
        .upsert({
          name: profile.name,
          color: profile.color,
          price_6m: profile.price_6m,
          price_per_m: profile.price_per_m
        }, {
          onConflict: 'name,color'
        });

      if (error) {
        console.error('Error syncing profile to Supabase:', error);
        return false;
      }
    }

    console.log('✅ Profiles synced to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Error syncing profiles to Supabase:', error);
    return false;
  }
}

export async function syncHardwareToSupabase(hardware: any[]): Promise<boolean> {
  if (!supabaseAvailable) return false;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return false;

  try {
    for (const item of hardware) {
      const { error } = await supabase
        .from('price_hardware')
        .upsert({
          name: item.name,
          price_per_package: parseFloat(item.pricePerPackage || '0'),
          price_per_piece: parseFloat(item.pricePerPiece || '0')
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error('Error syncing hardware to Supabase:', error);
        return false;
      }
    }

    console.log('✅ Hardware synced to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Error syncing hardware to Supabase:', error);
    return false;
  }
}

export async function syncGlassToSupabase(glass: any[]): Promise<boolean> {
  if (!supabaseAvailable) return false;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return false;

  try {
    for (const item of glass) {
      const { error } = await supabase
        .from('price_glass')
        .upsert({
          name: item.name,
          price_per_piece: parseFloat(item.pricePerPiece || '0'),
          price_per_m2: parseFloat(item.pricePerM2 || '0')
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error('Error syncing glass to Supabase:', error);
        return false;
      }
    }

    console.log('✅ Glass synced to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Error syncing glass to Supabase:', error);
    return false;
  }
}

export async function loadProfilesFromSupabase(): Promise<any[] | null> {
  if (!supabaseAvailable) return null;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return null;

  try {
    const { data, error } = await supabase
      .from('price_profiles')
      .select('*');

    if (error) {
      console.error('Error loading profiles from Supabase:', error);
      return null;
    }

    const profilesMap: { [key: string]: any } = {};

    data.forEach((item: any) => {
      if (!profilesMap[item.name]) {
        profilesMap[item.name] = {
          name: item.name,
          colors: {}
        };
      }

      profilesMap[item.name].colors[item.color] = {
        price6m: item.price_6m.toString(),
        pricePerM: item.price_per_m.toString()
      };
    });

    return Object.values(profilesMap);
  } catch (error) {
    console.error('Error loading profiles from Supabase:', error);
    return null;
  }
}

export async function loadHardwareFromSupabase(): Promise<any[] | null> {
  if (!supabaseAvailable) return null;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return null;

  try {
    const { data, error } = await supabase
      .from('price_hardware')
      .select('*');

    if (error) {
      console.error('Error loading hardware from Supabase:', error);
      return null;
    }

    return data.map((item: any) => ({
      name: item.name,
      pricePerPackage: item.price_per_package.toString(),
      pricePerPiece: item.price_per_piece.toString()
    }));
  } catch (error) {
    console.error('Error loading hardware from Supabase:', error);
    return null;
  }
}

export async function loadGlassFromSupabase(): Promise<any[] | null> {
  if (!supabaseAvailable) return null;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return null;

  try {
    const { data, error } = await supabase
      .from('price_glass')
      .select('*');

    if (error) {
      console.error('Error loading glass from Supabase:', error);
      return null;
    }

    return data.map((item: any) => ({
      name: item.name,
      pricePerPiece: item.price_per_piece.toString(),
      pricePerM2: item.price_per_m2.toString()
    }));
  } catch (error) {
    console.error('Error loading glass from Supabase:', error);
    return null;
  }
}

export async function getPriceChangeHistory(
  itemType?: 'profile' | 'hardware' | 'glass',
  itemName?: string,
  limit: number = 50
): Promise<PriceChangeRecord[]> {
  if (!supabaseAvailable) return [];

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return [];

  try {
    let query = supabase
      .from('price_change_history')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    if (itemName) {
      query = query.eq('item_name', itemName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading price change history:', error);
      return [];
    }

    return data as PriceChangeRecord[];
  } catch (error) {
    console.error('Error loading price change history:', error);
    return [];
  }
}

export function subscribeToProfileChanges(callback: () => void) {
  if (!supabaseAvailable) return null;

  const subscription = supabase
    .channel('price_profiles_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'price_profiles'
      },
      (payload) => {
        console.log('🔔 Profile price changed in Supabase:', payload);
        callback();
      }
    )
    .subscribe();

  return subscription;
}

export function subscribeToHardwareChanges(callback: () => void) {
  if (!supabaseAvailable) return null;

  const subscription = supabase
    .channel('price_hardware_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'price_hardware'
      },
      (payload) => {
        console.log('🔔 Hardware price changed in Supabase:', payload);
        callback();
      }
    )
    .subscribe();

  return subscription;
}

export function subscribeToGlassChanges(callback: () => void) {
  if (!supabaseAvailable) return null;

  const subscription = supabase
    .channel('price_glass_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'price_glass'
      },
      (payload) => {
        console.log('🔔 Glass price changed in Supabase:', payload);
        callback();
      }
    )
    .subscribe();

  return subscription;
}

export async function syncIvaPercentageToSupabase(percentage: number): Promise<boolean> {
  if (!supabaseAvailable) return false;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return false;

  try {
    const { data: existingConfig } = await supabase
      .from('price_iva_config')
      .select('id')
      .limit(1)
      .single();

    if (existingConfig) {
      const { error } = await supabase
        .from('price_iva_config')
        .update({ iva_percentage: percentage })
        .eq('id', existingConfig.id);

      if (error) {
        console.error('Error updating IVA percentage in Supabase:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('price_iva_config')
        .insert({ iva_percentage: percentage });

      if (error) {
        console.error('Error inserting IVA percentage in Supabase:', error);
        return false;
      }
    }

    console.log('✅ IVA percentage synced to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Error syncing IVA percentage to Supabase:', error);
    return false;
  }
}

export async function loadIvaPercentageFromSupabase(): Promise<number | null> {
  if (!supabaseAvailable) return null;

  const tablesExist = await ensureTablesExist();
  if (!tablesExist) return null;

  try {
    const { data, error } = await supabase
      .from('price_iva_config')
      .select('iva_percentage')
      .limit(1)
      .single();

    if (error) {
      console.error('Error loading IVA percentage from Supabase:', error);
      return null;
    }

    return data?.iva_percentage ?? null;
  } catch (error) {
    console.error('Error loading IVA percentage from Supabase:', error);
    return null;
  }
}
