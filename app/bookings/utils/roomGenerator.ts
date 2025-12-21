import { BASE_PRICES } from "./pricing";

type RoomCategory =
  | "Executive"
  | "Deluxe"
  | "Premium"
  | "Suite"
  | "Deluxe Non AC"
  | "Handicap";

export const generateRoomsForDB = () => {
  const rooms: {
    room_number: string;
    category: RoomCategory;
    price_per_day: number;
    status: "free";
  }[] = [];

  const add = (room_number: string, category: RoomCategory) => {
    rooms.push({
      room_number,
      category,
      price_per_day: BASE_PRICES[category] ?? 0,
      status: "free",
    });
  };

  /* ========= FLOOR 1 ========= */
  add("101", "Executive");
  add("102", "Executive");
  add("103", "Executive");
  add("104", "Premium");
  add("105", "Suite");
  add("106", "Executive");
  add("107", "Executive");

  /* ========= FLOOR 2 ========= */
  add("201", "Executive");
  add("202", "Executive");
  add("203", "Executive");
  add("204", "Executive");

  /* ========= FLOOR 3 ========= */
  add("301", "Executive");
  add("302", "Executive");
  add("303", "Executive");
  add("304", "Executive");
  add("305", "Deluxe Non AC");

  /* ========= FLOOR 4 ========= */
  add("401", "Executive");
  add("402", "Executive");
  add("403", "Executive");
  add("404", "Premium");
  add("405", "Deluxe");
  add("406", "Premium");
  add("407", "Executive");
  add("408", "Executive");
  add("409", "Deluxe Non AC");

  /* ========= FLOOR 5 ========= */
  add("501", "Executive");
  add("502", "Deluxe");
  add("503", "Deluxe");
  add("504", "Deluxe");
  add("505", "Deluxe");
  add("506", "Deluxe");
  add("507", "Executive");
  add("508", "Handicap");

  return rooms;
};
