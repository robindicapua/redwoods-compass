# Discussion: Removing Subcategory Titles

Currently, subcategories are used to group questions logically within a Category, but their titles are hidden by default in the UI to reduce clutter.

If we decide to remove the subcategory titles altogether in the future, we should consider the following changes:

### 1. UI Alterations (`index.html`)
- Remove the hidden subcategory toggle completely (`<label for="toggleSub">` and `<input id="toggleSub">`).

### 2. Logic Alterations (`script.js`)
- Remove the `showSub` state variable entirely.
- Remove the event listener for `toggleSubEl.addEventListener('change', ...)`.
- Modify the parsing structure in `parseQuestions` or simply map them flat immediately upon JSON fetch. Instead of grouping by Categories -> Subcategories, just group by Categories -> Questions.
  - In the grouped object logic:
    ```javascript
    grouped[q.category] = { desc: q.categoryDescription || '', qs: [] };
    ```
- Flatten the rendering loops in `render()`. We would no longer need the conditionally rendered wrapper `<div class="px-4 py-2 bg-[#343536]...">${sub}</div>`. We can iterate over `grouped[cat].qs` directly.

### 3. Data Alterations (`src/redwoods_compass_questions_v0.6.json`)
- Should we clean up the source JSON to remove the `"Subcategory"` key from all questions? It might save file size and reduce redundancy if they are no longer used anywhere.

### 4. CSV Export Alterations
- In `exportCSV()`, we currently output a `Subcategory` column. We would need to decide whether to:
  a. Keep the column structure to match existing templates (and leave it blank or just output the JSON variable if it's there).
  b. Remove the `Subcategory` column from the CSV header and rows entirely.
