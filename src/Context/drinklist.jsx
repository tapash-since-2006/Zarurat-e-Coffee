import { supabase } from '../../supabase';

export async function fetchUserDrinkList(userId) {
  const { data, error } = await supabase
    .from('drinklist')
    .select('name, caffeine_mg, cost')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function addDrinkToUserList(userId, name, caffeine_mg, cost) {
  const { error } = await supabase.from('drinklist').insert([
    {
      user_id: userId,
      name,
      caffeine_mg,
      cost,
    },
  ]);
  if (error) throw error;
}
