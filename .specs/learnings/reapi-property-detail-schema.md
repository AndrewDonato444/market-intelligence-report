# RealEstateAPI Property Detail Response Schema

Reference for all available data points from `/v2/PropertyDetail`.

## Key Objects

| Object | Description | Use Case |
|--------|-------------|----------|
| Root level | Flags (absenteeOwner, freeClear, mlsActive, etc.) + estimatedValue | Quick property screening |
| propertyInfo | Full address, lat/long, sqft, beds, baths, construction, amenities | Core property data |
| ownerInfo | Owner names, mailing address, ownership length, equity | Owner intelligence |
| taxInfo | Assessed values, tax amount, market value | Valuation layer |
| saleHistory[] | Full chain of title with buyer/seller names, amounts, types | Transaction analysis |
| mortgageHistory[] | All mortgages with amounts, rates, lenders | Financing patterns |
| currentMortgages[] | Active mortgages with rates, amounts, lender | Current debt position |
| mlsHistory[] | Listing history: price, status, agent, days on market | Market activity |
| lotInfo | APN, acres, sqft, zoning, legal description | Land analysis |
| demographics | Median income, fair market rent (HUD data, zip level) | Area economics |
| schools[] | Nearby schools with ratings, enrollment, grades | Neighborhood quality |
| neighborhood | Name, type, center point | Location context |
| comps[] | Comparable properties with values, distances | Valuation comps |
| lastSale | Detailed last sale (buyer/seller, method, down payment) | Latest transaction |
| linkedProperties | All properties owned by same owner | Portfolio analysis |
| foreclosureInfo[] | Foreclosure documents (if applicable) | Distress indicators |
| auctionInfo | Auction details (if applicable) | Distress indicators |

## Root Level Flags (boolean)

Most useful for filtering/screening:
- `absenteeOwner`, `outOfStateAbsenteeOwner`, `inStateAbsenteeOwner`
- `corporateOwned`, `investorBuyer`
- `ownerOccupied`, `vacant`
- `freeClear`, `highEquity`, `cashBuyer`, `cashSale`
- `mlsActive`, `mlsPending`, `mlsSold`, `mlsCancelled`
- `preForeclosure`, `auction`, `lien`, `judgment`
- `floodZone` + `floodZoneType` + `floodZoneDescription`

## Root Level Values

- `estimatedValue` — AVM estimate
- `estimatedEquity`, `equityPercent`
- `estimatedMortgageBalance`, `estimatedMortgagePayment`
- `lastSaleDate`, `lastSalePrice`
- `propertyType` — SFR, CONDO, etc.
- `lastUpdateDate` — data freshness

## Non-Disclosure States

Texas and other non-disclosure states will have `saleAmount: 0` in sale history.
Check `transactionType` — "Transfer" often has $0 amount.
