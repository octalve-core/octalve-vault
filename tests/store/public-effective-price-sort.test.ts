import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { parsePublicCatalogueParams } from "../../src/features/store/catalogue/catalogue-index.ts";
import { sortPublicProductsByEffectivePrice } from "../../src/features/store/catalogue/public-price-sort.ts";
import type { PublicProduct, PublicProductPrice } from "../../src/features/store/catalogue/types.ts";
const root=process.cwd();
const source=(p:string)=>readFileSync(resolve(root,p),"utf8");
function price(regular:number,sale:number|null):PublicProductPrice{
 const effective=sale??regular;
 return {regularAmountMinor:regular,saleAmountMinor:sale,effectiveAmountMinor:effective,
  discountPercent:sale===null?null:Math.round(((regular-sale)*100)/regular),isOnSale:sale!==null};
}
function product(id:string,priceDetails:PublicProduct["priceDetails"]):PublicProduct{
 const prices:PublicProduct["prices"]={};
 for(const c of ["NGN","USD","GBP","EUR"] as const){const p=priceDetails?.[c];if(p)prices[c]=p.effectiveAmountMinor}
 return {id,slug:id,category:"Strategy",imagePath:null,featured:false,status:"ACTIVE",purchasable:true,
  title:id,shortDescription:id,description:null,businessBenefits:[],productivityBenefits:[],prices,priceDetails};
}
test("ascending uses effective sale price and missing selected-currency prices last",()=>{
 const p=[product("regular-30",{NGN:price(30000,null)}),product("sale-20",{NGN:price(50000,20000)}),
  product("missing",{USD:price(100,null)}),product("regular-25",{NGN:price(25000,null)})];
 assert.deepEqual(sortPublicProductsByEffectivePrice(p,"NGN","price-asc").map(x=>x.id),
  ["sale-20","regular-25","regular-30","missing"]);
});
test("descending keeps missing prices last",()=>{
 const p=[product("low",{NGN:price(10000,null)}),product("missing",{USD:price(100,null)}),product("high",{NGN:price(30000,null)})];
 assert.deepEqual(sortPublicProductsByEffectivePrice(p,"NGN","price-desc").map(x=>x.id),["high","low","missing"]);
});
test("selected currency changes price order",()=>{
 const p=[product("alpha",{NGN:price(10000,null),USD:price(500,null)}),product("beta",{NGN:price(20000,null),USD:price(100,null)})];
 assert.deepEqual(sortPublicProductsByEffectivePrice(p,"NGN","price-asc").map(x=>x.id),["alpha","beta"]);
 assert.deepEqual(sortPublicProductsByEffectivePrice(p,"USD","price-asc").map(x=>x.id),["beta","alpha"]);
});
test("ties and missing currency are deterministic by id",()=>{
 const tied=[product("zeta",{NGN:price(10000,null)}),product("alpha",{NGN:price(20000,10000)})];
 assert.deepEqual(sortPublicProductsByEffectivePrice(tied,"NGN","price-desc").map(x=>x.id),["alpha","zeta"]);
 assert.deepEqual(sortPublicProductsByEffectivePrice(tied,null,"price-asc").map(x=>x.id),["alpha","zeta"]);
});
test("parser accepts price sorts with supported selected currency",()=>{
 const a=parsePublicCatalogueParams(new URLSearchParams("sort=price-asc&currency=NGN"));
 const d=parsePublicCatalogueParams(new URLSearchParams("sort=price-desc&currency=USD"));
 assert.equal(a.sort,"price-asc");assert.equal(a.currency,"NGN");assert.equal(d.sort,"price-desc");assert.equal(d.currency,"USD");
});
test("catalogue sorts mapped/filtered public products through validated effective price",()=>{
 const s=source("src/features/store/catalogue/catalogue-service.ts");
 const h=source("src/features/store/catalogue/public-price-sort.ts");
 assert.match(s,/sortPublicProductsByEffectivePrice/);assert.match(s,/filteredProducts/);
 assert.match(h,/priceDetails\?\.\[currency\][\s\S]*effectiveAmountMinor/);assert.doesNotMatch(h,/saleAmountMinor/);
});
test("Shop exposes price sorts and price-sensitive currency synchronization",()=>{
 const c=source("src/features/store/products/shop-discovery-controls.tsx");
 for(const p of [/value: "price-asc"/,/value: "price-desc"/,/shop\.sortPriceLowHigh/,/shop\.sortPriceHighLow/,/priceSensitive/,
  /input\.sort === "price-asc"/,/input\.sort === "price-desc"/])assert.match(c,p);
});
test("price-sort labels exist for EN FR and AR",()=>{
 const m=source("src/i18n/messages.ts");
 assert.equal((m.match(/"shop\.sortPriceLowHigh":/g)??[]).length,3);
 assert.equal((m.match(/"shop\.sortPriceHighLow":/g)??[]).length,3);
});
