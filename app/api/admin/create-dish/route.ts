// app/api/admin/create-dish/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { name, ingredients } = await req.json();
    // ingredients: [{ ingredient_name or id, quantity, unit }]
    if (!name || !Array.isArray(ingredients)) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const sb = createServerSupabase();

    const { data: dish, error: dishErr } = await sb.from("dishes").insert({ name }).select().single();
    if (dishErr) throw dishErr;

    // map ingredient names to inventory ids
    for (const ing of ingredients) {
      let ingredientId = ing.id;
      if (!ingredientId && ing.name) {
        // find by name
        const { data: found } = await sb.from("inventory_items").select("id").ilike("name", ing.name).limit(1);
        ingredientId = found?.[0]?.id;
      }
      if (!ingredientId) continue;
      await sb.from("dish_ingredients").insert({
        dish_id: dish.id,
        ingredient_id: ingredientId,
        quantity: ing.quantity,
        unit: ing.unit
      });
    }

    return NextResponse.json({ ok: true, dish });
  } catch (err:any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "unknown" }, { status: 500 });
  }
}
