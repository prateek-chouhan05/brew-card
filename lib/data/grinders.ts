/* Generated from the original Brew Card page. Edit freely — this is now the source of truth. */
import type { Grinder } from '../types';

export const METHODS: string[] = ["Espresso","Moka pot","AeroPress, short steep","V60 / cone","Flat-bottom pour over","Drip machine","Chemex","French press","Cold brew"];

export const GRINDERS: Grinder[] = [
  {id:"c3s",   brand:"Timemore", name:"Timemore C3S",          unit:"clicks", min:0, max:36,  floor:6,
   a:[9,12,13,15,16,17,19,22,25],              r:[[8,11],[11,13],[13,14],[14,16],[15,18],[16,19],[18,21],[21,24],[24,26]]},
  {id:"c3",    brand:"Timemore", name:"Timemore C3",           unit:"clicks", min:0, max:36,  floor:6,
   a:[9,12,15,20,21,22,23,25,29],              r:[[8,11],[11,14],[14,18],[18,21],[20,22],[21,23],[22,24],[24,27],[27,32]]},
  {id:"c2",    brand:"Timemore", name:"Timemore C2",           unit:"clicks", min:0, max:36,  floor:6,
   a:[9,12,14,16,17,18,20,22,25],              r:[[8,11],[11,13],[13,15],[15,17],[16,18],[17,20],[18,21],[21,24],[24,27]]},
  {id:"c40",   brand:"Comandante", name:"Comandante C40",      unit:"clicks", min:0, max:50,  floor:6,
   a:[10,14,19,25,28,29,30,33,37],             r:[[8,13],[13,16],[16,23],[23,28],[26,29],[28,30],[29,31],[31,35],[35,40]]},
  {id:"jxpro", brand:"1Zpresso", name:"1Zpresso JX-Pro",       unit:"clicks", min:0, max:200, floor:20,
   a:[68,112,118,120,126,134,152,179,192],     r:[[40,105],[105,116],[116,119],[119,126],[121,138],[126,152],[138,170],[168,186],[186,200]]},
  {id:"jmax",  brand:"1Zpresso", name:"1Zpresso J-Max",        unit:"clicks", min:0, max:450, floor:40,
   a:[118,193,202,206,219,241,289,363,415],    r:[[70,181],[181,199],[199,204],[204,219],[208,252],[219,289],[252,336],[331,391],[391,450]]},
  {id:"kplus", brand:"1Zpresso", name:"1Zpresso K-Plus",       unit:"clicks", min:0, max:180, floor:15,
   a:[39,64,67,68,73,81,98,128,154],           r:[[23,60],[60,66],[66,67],[68,73],[69,85],[73,98],[85,116],[114,141],[141,174]]},
  {id:"q2",    brand:"1Zpresso", name:"1Zpresso Q2",           unit:"clicks", min:0, max:100, floor:5,
   a:[12,19,28,39,44,47,52,60,72],             r:[[8,17],[17,23],[23,34],[34,44],[40,48],[44,52],[48,56],[56,66],[66,80]]},
  {id:"zp6",   brand:"1Zpresso", name:"1Zpresso ZP6 Special",  unit:"clicks", min:0, max:90,  floor:15,
   a:[23,30,37,47,52,55,61,71,82],             r:[[20,28],[28,34],[34,42],[43,52],[48,57],[52,61],[57,67],[66,77],[77,90]]},
  {id:"k6",    brand:"Kingrinder", name:"Kingrinder K6",       unit:"clicks", min:0, max:200, floor:8,
   a:[20,36,54,77,87,94,103,121,143],          r:[[12,31],[31,45],[45,67],[69,87],[80,96],[87,103],[96,113],[112,132],[132,160]]},
  {id:"k4",    brand:"Kingrinder", name:"Kingrinder K4",       unit:"clicks", min:0, max:240, floor:10,
   a:[27,50,66,82,92,98,108,126,148],          r:[[15,44],[44,59],[59,75],[76,92],[85,100],[92,108],[100,118],[117,137],[137,165]]},
  {id:"skerton", brand:"Hario", name:"Hario Skerton Pro",      unit:"clicks", min:0, max:15,  floor:2,
   a:[3,4,6,8,9,9,10,11,13],                   r:[[2,4],[4,5],[5,7],[7,9],[8,9],[9,10],[9,11],[11,12],[12,14]]},
  {id:"minimill", brand:"Hario", name:"Hario Mini Mill Slim+", unit:"clicks", min:0, max:15,  floor:2,
   a:[3,4,6,8,9,9,10,11,13],                   r:[[2,4],[4,5],[5,7],[7,9],[8,9],[9,10],[9,11],[11,12],[12,14]]},
  {id:"porlex", brand:"Porlex", name:"Porlex Mini II",         unit:"clicks", min:0, max:18,  floor:3,
   a:[5,6,8,10,11,11,12,13,15],                r:[[4,6],[6,7],[7,9],[9,11],[10,11],[11,12],[11,13],[13,14],[14,16]]},
  {id:"encore", brand:"Baratza", name:"Baratza Encore",        unit:"dial",   min:1, max:40,
   a:[6.6,10,14,19.3,21.8,23.5,26.1,30.7,36],  r:[[5,8.9],[8.9,11.9],[11.9,16.9],[17.3,21.8],[20,24.1],[21.8,26.1],[24.1,28.7],[28.4,33.3],[33.3,40]]},
  {id:"ode2",  brand:"Fellow", name:"Fellow Ode Gen 2",         unit:"ode",    min:1, max:11,
   a:[1.7,3,3.8,4.8,5.7,6.3,7.4,9.1,10.2],     r:[[1,2.6],[2.6,3.4],[3.4,4.4],[4.4,5.7],[5,6.6],[5.7,7.4],[6.6,8.5],[8.3,9.7],[9.7,11]]}
];

export const NATIVE: Record<string, Record<string, string>> = {
  "wac-2021-1st": {c40:"27"}, "wac-2021-2nd": {c40:"23"}, "wac-2019-2nd": {c40:"30"},
  "wac-2023-1st": {c40:"29", zp6:"65"}, "lance-hedrick-different-dark": {c40:"35", zp6:"65"},
  "wendelboe": {c40:"15–20"}, "april-coffee": {c40:"25–27"}, "sweet-bright-iced": {c40:"13"},
  "iced-coconut-aeropress": {c40:"20"}, "iac-2023-delhi": {q2:"70"},
  "orange-aeropress-coffee": {porlex:"4"}, "brown-sugar-oat-shaken": {c2:"8"}
};
