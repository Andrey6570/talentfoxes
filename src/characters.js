// Pet characters. Each character brings its own drawing function, so new ones are added here and nowhere else.
// A drawing receives the derived kid (colour, equipped accessories, mood) and returns an <svg> string.
// Accessories are drawn per character because each body has its own anchor points.
import { fox } from "./fox.js";

export const CHARACTERS = [
  { id: "fox", name: "Лисёнок", available: true, draw: fox },
  { id: "cat", name: "Котёнок", available: false },
  { id: "dragon", name: "Дракончик", available: false }
];

export const characterOf = k => CHARACTERS.find(c => c.id === (k.pet && k.pet.character) && c.available) || CHARACTERS[0];
export const drawPet = (k, cls, label) => characterOf(k).draw(k, cls, label);
