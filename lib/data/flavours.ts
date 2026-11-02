/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { Flavour, FlavourId } from '../types';

export const FLAVOURS: Flavour[] = [
  {id:"fruity",  label:"Fruity",          notes:"berries, grape, plum, tropical, jammy, winey",  beans:"Naturals, anaerobic and co-ferments — like your Yelnoorkhan",         brew:"Bypass and cooler-water recipes keep fruit juicy instead of sour; great iced."},
  {id:"citrus",  label:"Citrus",          notes:"lemon, orange, lime, grapefruit, bright",      beans:"Washed Kenyan, Ethiopian, Colombian",                                 brew:"High ratio, clean filters, 80–90 °C. Pairs with tonic and orange."},
  {id:"floral",  label:"Floral",          notes:"jasmine, bergamot, black tea, honeysuckle",    beans:"Washed Ethiopian, Geisha, very light Nordic roasts",                  brew:"Lean, gentle, clean recipes — Hoffmann, Wendelboe, V60-style."},
  {id:"caramel",  label:"Caramel & sweet", notes:"brown sugar, honey, toffee, jaggery, dates",   beans:"Honey-process and balanced mediums",                                  brew:"Everyday cups and concentrates with bypass; brown sugar and condensed milk."},
  {id:"nutty",  label:"Nutty",           notes:"almond, hazelnut, peanut, walnut, malt",       beans:"Brazils and Indian washed mediums",                                   brew:"Everyday cups and milk drinks; coconut and condensed milk."},
  {id:"chocolate",  label:"Chocolaty",       notes:"cocoa, dark chocolate, fudge, cacao nibs",     beans:"Medium-dark and espresso roasts — like your Truffle Twilight",        brew:"Milk, moka, concentrates, Coke Zero and Vietnamese-style."},
  {id:"bold",  label:"Bold & smoky",    notes:"smoky, roasty, woody, bittersweet",            beans:"Dark roasts, robusta, Vietnamese blends",                             brew:"Cooler water, a coarser grind, and something sweet or milky."}
];

export const HOUSE_PAIR: Record<string, [FlavourId[], string]> = {
  "my-clean":    [["floral","citrus","fruity"], "A high ratio and no stirring give a clean, tea-like cup with little body to hide behind, so delicate florals and bright acidity come through. Chocolaty beans taste thin this way."],
  "my-everyday": [["caramel","nutty","fruity"], "A lower 1:13 ratio adds body and sweetness, rounding out balanced medium beans — brown sugar, nuts, soft fruit. Forgiving with any bag."],
  "my-bypass":   [["fruity","citrus","caramel"], "Brewing strong and diluting after keeps the sweetness and aromatics but leaves heavy bitter compounds behind, so fermented and fruity lots taste juicy and defined."],
  "my-milk":     [["chocolate","nutty","caramel"], "Milk mutes acidity and amplifies roast sweetness. Chocolate, nut and caramel notes survive the dilution; fruity beans can taste sour or faint in milk."],
  "my-espresso": [["chocolate","bold","caramel"], "A dense 1:3 concentrate needs a bean with body. Chocolaty and darker roasts give the thick, sweet base milk or soda needs; light fruity beans turn sharp at this strength."],
  "my-moka":     [["chocolate","bold","nutty"], "The moka pot runs hot under pressure and extracts roast flavours hard. Chocolaty, nutty and darker beans love it; bright fruity beans turn harsh and sour."],
  "my-coldbrew": [["chocolate","nutty","caramel"], "Cold water pulls sweetness and body but little acidity, so chocolaty, nutty and caramel beans taste smooth and dessert-like. Bright fruity beans can taste flat cold-brewed."],
  "my-frenchpress": [["chocolate","nutty","caramel"], "A full steep and a metal mesh keep the oils and body, so chocolaty, nutty and caramel beans taste rich and round. The skim and the long settle stop it turning muddy."],
  "my-v60":      [["floral","citrus","fruity"], "A paper filter and a short contact time give the clearest cup on the card, so florals, citrus and fruit come through sharp and separate. Heavy, roasty beans can taste thin this way."],
  "my-46":       [["fruity","caramel","citrus"], "Five pours let you trade sweetness against brightness without touching the grind. Fruity and sweet beans show the difference best — the smaller first pour here leans sweet."],
  "my-coke":     [["chocolate","caramel","nutty"], "Cola is caramel, vanilla and spice, so chocolaty and caramel beans blend into it like a mocha-cola. For a twist, a fruity bean like your Yelnoorkhan makes it taste like cherry cola."]
};
