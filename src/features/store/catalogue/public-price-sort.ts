import type { CurrencyCode } from "../../../domain/constants.ts";
import type { PublicProduct } from "./types.ts";
export type PublicPriceSort="price-asc"|"price-desc";
export function isPublicPriceSort(value:string):value is PublicPriceSort{
 return value==="price-asc"||value==="price-desc";
}
export function sortPublicProductsByEffectivePrice(
 products:readonly PublicProduct[],currency:CurrencyCode|null,sort:PublicPriceSort,
):PublicProduct[]{
 const direction=sort==="price-asc"?1:-1;
 return [...products].sort((left,right)=>{
  const a=currency===null?null:left.priceDetails?.[currency]?.effectiveAmountMinor??null;
  const b=currency===null?null:right.priceDetails?.[currency]?.effectiveAmountMinor??null;
  if(a===null&&b===null)return left.id.localeCompare(right.id);
  if(a===null)return 1;if(b===null)return -1;
  if(a!==b)return (a-b)*direction;
  return left.id.localeCompare(right.id);
 });
}
