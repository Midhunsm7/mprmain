export function generateBillNumber() {
  const now = new Date();

  const datePart =
    now.getFullYear().toString().slice(-2) +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0");

  const timePart =
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const randomPart = Math.floor(Math.random() * 900 + 100); // 3-digit random number

  return `KOT-${datePart}${timePart}-${randomPart}`;
}
