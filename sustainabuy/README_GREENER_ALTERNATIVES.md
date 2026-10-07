# New Website Features: Implementation and Where to Find Them

This document proposes three additions to the current SustainaBuy website: an admin panel, greener alternatives, and analytics on the personal dashboard. These are planned features, not pages that can be opened in the current website yet.

## Current Website vs. Proposed Features

| Website area | Current behavior | Proposed addition | Where to view it after implementation |
|---|---|---|---|
| Search | Search the product catalogue, filter by nutrition grade, and save products | No change required | Search in the existing navigation |
| Product detail | View product information and the AI-predicted nutrition score | Same-category greener recommendations, based on a distinct environmental score | A new section on `/product/:id` |
| Personal dashboard | View and remove the signed-in user's saved product history | Charts and best/worst product summaries based only on that user's history | Analytics section on the existing `/dashboard` |
| Product entry | Users keep the existing Add Product form; login is required to save to the catalogue | Admins also get an Add Product action, plus catalogue-wide edit and delete controls | User form at `/add-product`; admin management at `/admin` |
| Authentication | Sign up and log in; the user model already has a `user` or `admin` role | Enforce roles in backend routes and show admin navigation only to admins | Admin link appears after an admin logs in |

The additions should extend the relevant pages without replacing current search, product detail, saved history, or product entry flows. Both users and admins can add products, but through role-appropriate workflows: the existing user form remains available, while admin product management adds broader catalogue permissions. Analytics supplements rather than replaces the saved-history list.

## 1. Admin Panel

### How an admin would view it

An authenticated admin logs in and chooses **Admin** in the navigation to open `/admin`. Regular users should not see this navigation item and must not be able to access the page or its APIs by entering the URL directly.

### What it adds

- A product-management view for listing, adding, editing, and deleting catalogue products. The admin's Add Product action creates a catalogue item directly; it does not remove or replace the existing user-facing Add Product form.
- A user list showing safe account fields such as name, email, role, and join date. Never return password hashes or tokens.
- Clear confirmation before destructive actions and validation feedback for edits.

The current user schema already defines `role`, and login includes that role in its JWT. The current website does not yet have an admin page or admin-only route enforcement. Add backend role-check middleware and apply it to every admin API; frontend route guards and hidden navigation are usability controls, not security boundaries. Prevent public registration from assigning the admin role; provision admins through a trusted seed or protected process.

Suggested API surface:

```text
GET    /api/admin/users
GET    /api/admin/products
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
```

Keep `/add-product` as the existing user submission flow. Users must log in to save the submitted product; admins can add products from `/admin` and additionally edit or delete catalogue entries. These can share product validation and form fields, but the admin actions must use admin-protected APIs. The current client checks login before saving a user submission, but `POST /api/products` itself currently has no authentication middleware; enforce the intended user permission on the backend as well. Do not make the user form admin-only.

## 2. Greener Alternatives

## Goal

When a shopper views a product, recommend a few products from the same category with a better sustainability score. The recommendation should make comparisons easy and explain why an item ranks higher.

## Important: distinguish nutrition from environmental impact

The current AI model is trained to predict Open Food Facts' `nutrition-score-fr_100g`, using ingredients, packaging, and nutrition values. That is a nutrition score, not a measured environmental-impact score. Its direction is also lower-is-better, so sorting its raw values from highest to lowest would rank products incorrectly.

For a feature called **Greener alternatives**, first add or source an environmental score with a documented meaning and a consistent scale, for example 0-100 where higher means lower environmental impact. Use verified impact data or clearly disclosed environmental indicators. Do not label the existing predicted nutrition score as an eco score.

As an interim feature, the app can recommend **healthier alternatives** using the existing nutrition score, with lower scores ranked first. Keep that separate from environmental recommendations.

### How a shopper would view it

Open any product from Search. Its `/product/:id` page would show **Greener alternatives** as a separate section beneath the existing product and AI nutrition-score information. It should show up to three higher-scoring products from the same category, exclude the viewed product, and link each suggestion to its own detail page. Include the score difference and a short explanation of the ranking.

This does not change the existing AI nutrition score or the product's nutrition grade. Show loading, no-match, missing-score, and error states honestly; do not describe a product as greener if its environmental score is unavailable.

## How it can fit this app

The app already stores `categories` on each product and provides product details through `GET /api/products/:id/score`. Add a separate recommendation endpoint and a section to the existing React product detail page.

### Backend

Add an endpoint such as:

```text
GET /api/products/:id/alternatives?limit=3
```

Suggested behavior:

- Load the requested product; return 404 if it does not exist.
- Find products whose normalized category matches the viewed product, excluding the viewed product itself.
- Require a valid environmental score for both the viewed product and each candidate.
- Keep only candidates with a strictly higher environmental score.
- Sort by score descending, then use a stable tie-breaker such as product name; limit the result count.
- Return the current product score and the candidate products with their score differences, so the UI does not need to recalculate them.
- Return an empty list when there are no valid alternatives. Do not silently substitute nutrition scores.

The current `categories` field is a string and can contain multiple comma-separated categories. For a first version, match a normalized category token rather than using a loose substring match. Longer term, store categories as normalized identifiers or an array to make matching reliable.

### Score and data options

Choose one defensible source before implementation:

- Import a trusted environmental score already available in product data, recording its source and scale.
- Add a transparent, versioned estimate based on documented environmental indicators and clearly label it as an estimate.
- Train a separate environmental model only after obtaining a suitable environmental-impact target. The existing nutrition target is not suitable for this purpose.

Persist the score and its source/version with each product, or cache predictions with a model version and refresh policy. Avoid calling the AI service individually for every candidate on each page view; that would make recommendation latency and AI-service availability depend on the number of products in the category. If inference is necessary, add a batch-scoring operation and cache its results.

A possible product field design is:

```js
environmentalScore: { type: Number, default: null },
environmentalScoreSource: { type: String, default: "unknown" },
environmentalScoreVersion: { type: String, default: null },
```

Use the score's documented scale consistently. The UI should not assume that a larger value is better unless the chosen score definition guarantees it.

### Frontend

In `client/src/pages/ProductDetail.js`:

- Fetch alternatives for the current product ID.
- Render a compact list under the score area, linking each suggested product to `/product/:id`.
- Show each candidate's score and improvement relative to the current product.
- Keep unavailable environmental scores distinct from the existing nutrition prediction.
- Reset and reload the alternatives when the route product ID changes.

### API response sketch

```json
{
  "scoreSource": "environmental-impact-v1",
  "currentScore": 72,
  "alternatives": [
    {
      "_id": "product-id",
      "name": "Example product",
      "brands": "Example brand",
      "categories": "Example category",
      "environmentalScore": 84,
      "scoreDifference": 12
    }
  ]
}
```

The values above are illustrative only; they are not scores currently produced by the app.

## 3. Analytics Dashboard

### How a user would view it

A signed-in user opens **Dashboard** in the existing navigation at `/dashboard`. Keep the current saved-history list and its remove action. Add a distinct **Analytics** section on that page, for example above the list, with charts and summary values computed only from the signed-in user's own records.

Suggested charts and summaries:

- Score over time, with the selected score clearly identified as nutrition or environmental.
- Best and worst products, using the chosen score's documented direction.
- Optional counts such as products viewed and average score, with an empty state when there is not enough history.

The current dashboard lists saved products, and each history record stores `viewedAt`. However, saving the same product updates its existing record instead of creating another event, and the record does not store a score snapshot. A real score-over-time chart therefore needs historical snapshots (for example, append a history event with the score and score type/version at view time) or a separate score-history collection. Do not invent older scores from the product's current value.

Add a user-scoped analytics API, such as `GET /api/history/analytics`, that derives results from the authenticated user's records only. A chart library such as Recharts or Chart.js can render the data. If no environmental score exists yet, label any chart based on the current model as **Nutrition score over time**, not environmental impact.

## Keep the Features Separate

- **Admin panel** manages the shared catalogue and account list; personal analytics never exposes other users' data.
- **Greener alternatives** helps compare the current product with same-category products; it does not replace search or the existing nutrition grade.
- **Analytics** summarizes one signed-in user's history; it does not change how products are searched, scored, or saved.
- Keep the existing Search, Add Product, product detail, and saved-history list available after these additions.

## Suggested Implementation Order

1. Add backend admin authorization and tests first; then build the admin page and protected user/product APIs.
2. Choose and document a valid environmental score source and confirm which direction is better.
3. Add environmental score fields and implement/test same-category alternatives; add the section to product detail.
4. Decide on a history event/snapshot design, add the user-scoped analytics API, and show charts on the existing dashboard.
5. Verify each feature with regular-user/admin access, missing data, empty history, and service-unavailable cases.

If a defensible environmental score source is not available yet, implement the same-category comparison as a separately named **Healthier alternatives** feature using the current nutrition score, where a lower predicted score ranks better.

## Acceptance Criteria

- Only admins can access admin pages and admin APIs; regular users receive an authorization error even when calling an API directly.
- The admin user list excludes passwords, password hashes, and authentication tokens; both user product submission and admin product creation remain available with their intended backend permissions.
- Recommendations never include the viewed product, match a normalized category, and include only candidates whose known environmental score is strictly higher.
- Recommendation sorting and score differences agree with the documented score direction; missing values never produce a false greener claim.
- Analytics reads only the authenticated user's history, and score-over-time values come from stored historical snapshots rather than today's score reused for past dates.
- Search, product details, Add Product, and the current saved-history list continue to work independently of the new sections.
