// Explicit commodity families only. Unclassified products remain pending rather
// than receiving one inflation percentage for every material.
export function commodityFor(name){
 const s=String(name).toLowerCase();
 const rules=[
 [1,/ready\s*mix|beton (?:fc|f'c|k[- ]?\d)|beton mutu/],[2,/amplas/],[3,/anak kunci/],[4,/asbes/],[5,/aspal/],[6,/atap aluminium|awning/],
 [8,/besi beton|baja tulangan|besi tulangan|wiremesh/],[9,/bak (?:cuci|mandi).*baja/],[27,/kaso/],[53,/reng kayu/],[43,/papan kayu/],[10,/balok kayu/],[31,/triplek|multiplek|plywood|teakwood/],[30,/kayu (?:gelondong|bulat)/],
 [11,/batako/],[12,/bata (?:merah|ringan)|batu bata/],[13,/batu (?:belah|kali|fondasi|gunung)/],[14,/batu (?:split|pecah)|agregat kasar|abu batu|screening/],[15,/batu tela/],[16,/baut|\bmur\b/],
 [17,/cat.*(?:anti karat|anti lumut)/],[18,/cat dasar|meni/],[19,/cat (?:kayu|besi)/],[20,/cat (?:tembok|dinding)/],[21,/dempul/],[22,/engsel/],[23,/fitting lampu/],[24,/genteng/],[25,/kabel/],[26,/kaca/],[28,/kawat beton|kawat baja|kawat las/],[29,/bronjong|kawat harmonika/],
 [32,/kusen.*aluminium|aluminium.*kusen/],[33,/kerikil/],[34,/minyak tanah/],[35,/kloset|closet/],[36,/kran/],[37,/gembok/],[38,/lampu/],[39,/\blem\b|perekat/],[40,/plat baja|pelat baja|plat besi|besi siku|besi strip/],[41,/pelumas|oli mesin/],[42,/paku/],[44,/gips|gypsum/],
 [58,/sirtu/],[45,/pasir/],[46,/pelat seng/],[47,/circuit breaker|\bmcb\b|\bmccb\b/],[48,/pipa aluminium/],[49,/pipa.*pvc|pvc.*pipa/],[50,/plamur/],[51,/pompa air/],[52,/profil baja|rangka baja|baja profil/],[54,/sakelar|saklar/],[55,/sekrup/],[56,/semen/],[57,/seng/],[59,/stop kontak/],[60,/tanah urug|timbunan tanah/],[61,/toren|tangki air.*plastik/],[62,/thinner|tiner/],[63,/marmer|granit/],[64,/keramik/],[65,/wastafel/]
 ];return rules.find(([,re])=>re.test(s))?.[0]??null;
}
