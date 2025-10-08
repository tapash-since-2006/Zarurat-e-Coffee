import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function LogDrinkModal({ userId, onSelect, onClose }) {
  const [drinkList, setDrinkList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCaffeine, setCustomCaffeine] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (!userId) {
      setDrinkList([]);
      setLoading(false);
      return;
    }

    async function fetchDrinks() {
      setLoading(true);
      try {
        // Fetch user custom drinks
        const { data: userDrinks, error: userError } = await supabase
          .from('drinklist')
          .select('id, name, caffeine_mg, cost')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (userError) {
          console.error('Error fetching user drinks:', userError);
        }

        // Fetch default drinks
        const { data: defaultDrinks, error: defaultError } = await supabase
          .from('defaultdrinklist')
          .select('id, name, caffeine_mg, cost')
          .order('name', { ascending: true });

        if (defaultError) {
          console.error('Error fetching default drinks:', defaultError);
        }

        // Merge lists, prioritize user drinks on duplicate names
        const merged = [];
        const userDrinkNames = new Set((userDrinks ?? []).map((d) => d.name));
        if (userDrinks) merged.push(...userDrinks);
        if (defaultDrinks) {
          defaultDrinks.forEach((d) => {
            if (!userDrinkNames.has(d.name)) {
              merged.push(d);
            }
          });
        }
        setDrinkList(merged);
      } catch (error) {
        console.error('Unexpected error fetching drinks:', error);
        setDrinkList([]);
      }
      setLoading(false);
    }

    fetchDrinks();
  }, [userId]);

  const logDrinkConsumption = async (name, caffeine_mg, cost) => {
    try {
      const { error } = await supabase
        .from('drinks')
        .insert([
          {
            user_id: userId,
            name,
            caffeine_mg: Number(caffeine_mg),
            cost: Number(cost),
            consumed_at: Date.now(),
          },
        ]);

      if (error) {
        console.error('Error logging drink consumption:', error);
        alert('Error logging your drink consumption: ' + error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Unexpected error logging drink:', err);
      alert('Unexpected error logging drink.');
      return false;
    }
  };

  const handleSelectExistingDrink = async (drink) => {
    const success = await logDrinkConsumption(drink.name, drink.caffeine_mg, drink.cost);
    if (!success) return;
    onSelect(drink.name, String(drink.caffeine_mg ?? 0), String(drink.cost ?? 0));
    onClose(); // 👈 add this line

  };

  const handleCustomSubmit = async () => {
    if (!customName.trim()) {
      alert('Please enter a name for your drink.');
      return;
    }

    if (customCaffeine !== '' && (isNaN(customCaffeine) || Number(customCaffeine) < 0)) {
      alert('Please enter a valid caffeine amount.');
      return;
    }

    if (customCost !== '' && (isNaN(customCost) || Number(customCost) < 0)) {
      alert('Please enter a valid cost.');
      return;
    }

    if (!userId) {
      alert('User not logged in.');
      return;
    }

    try {
      const { data: existingDrinks, error: fetchError } = await supabase
        .from('drinklist')
        .select('id')
        .eq('user_id', userId)
        .eq('name', customName.trim())
        .eq('caffeine_mg', Number(customCaffeine) || 0)
        .eq('cost', Number(customCost) || 0)
        .limit(1);

      if (fetchError) {
        console.error('Error checking existing drinks:', fetchError);
        alert('Failed to check existing drinks. Please try again.');
        return;
      }

      if (existingDrinks && existingDrinks.length > 0) {
        alert('This drink with the same name, caffeine, and cost already exists.');
        return;
      }

      const { data: drinklistData, error: drinklistError } = await supabase
        .from('drinklist')
        .insert([
          {
            user_id: userId,
            name: customName.trim(),
            caffeine_mg: Number(customCaffeine) || 0,
            cost: Number(customCost) || 0,
          },
        ])
        .select();

      if (drinklistError) {
        console.error('Error inserting into drinklist:', drinklistError);
        alert('Error adding drink to your list: ' + drinklistError.message);
        return;
      }

      const newDrink = drinklistData[0];
      setDrinkList((prev) => [...prev, newDrink]);

      const { error: drinksError } = await supabase
        .from('drinks')
        .insert([
          {
            user_id: userId,
            name: newDrink.name,
            caffeine_mg: newDrink.caffeine_mg,
            cost: newDrink.cost,
            consumed_at: Date.now(),
          },
        ]);

      if (drinksError) {
        console.error('Error logging drink consumption:', drinksError);
        alert('Error logging your drink consumption: ' + drinksError.message);
        return;
      }

      onSelect(newDrink.name, String(newDrink.caffeine_mg), String(newDrink.cost));
      onClose(); // 👈 add this line

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Select a Drink</h3>

        {!showCustomInput ? (
          <>
            {loading ? (
              <p>Loading drinks...</p>
            ) : drinkList.length === 0 ? (
              <p>No drinks found. Please add your custom drink.</p>
            ) : (
              <ul className="drink-list">
                {drinkList.map((drink) => (
                  <li key={drink.id}>
                    <button
                      onClick={() => handleSelectExistingDrink(drink)}
                      className="drink-button"
                    >
                      {drink.name} — {drink.caffeine_mg ?? 0} mg caffeine — ₹{drink.cost ?? 0}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => setShowCustomInput(true)}>
                Add Other
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="input-group">
              <label>Drink Name:</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter drink name"
              />
            </div>
            <div className="input-group">
              <label>Caffeine (mg):</label>
              <input
                type="number"
                value={customCaffeine}
                onChange={(e) => setCustomCaffeine(e.target.value)}
                placeholder="Enter caffeine amount"
                min="0"
              />
            </div>
            <div className="input-group">
              <label>Cost (₹):</label>
              <input
                type="number"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                placeholder="Enter cost"
                min="0"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCustomSubmit}>
                Add Drink
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomName('');
                  setCustomCaffeine('');
                  setCustomCost('');
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
