# Redwoods Compass JSON Schema Documentation

Version: 0.6
Master File: `redwoods_compass_questions_v0.6.json`

## Overview
The `redwoods_compass_questions_v0.6.json` file serves as the core data structure for the Redwoods Compass assessment tool. It organizes architectural and organizational maturity questions into thematic categories, subcategories, and conditional logic.

## 1. Root Structure
The JSON is structured as a **single array of Category Objects**.

```json
[
  { "Category": "...", "CategoryDescription": "...", "Questions": [...] },
  ...
]
```

## 2. Category Object
Each category represents a high-level assessment area (e.g., Authority, Alignment, People).

| Key | Type | Description |
| :--- | :--- | :--- |
| `Category` | String | The name of the assessment pillar. |
| `CategoryDescription` | String | A high-level description of what this category measures. |
| `Questions` | Array | A list of individual question objects. |

---

## 3. Question Object
This is the most granular level of data.

| Key | Type | Description |
| :--- | :--- | :--- |
| `id` | String (Optional) | A unique identifier. **Required** only if the question is referenced by a `showIf` condition. |
| `Subcategory` | String | A thematic grouping within the Category. |
| `Question` | String | The actual text of the question. |
| `Description` | String | Context, clarification, or details on what is being measured. |
| `Infotip` | String | Direct instructions or utility tips for the UI (e.g., "Select 'Yes' if..."). |
| `Answer` | String | Placeholder for user response data (initialized as empty). |
| `showIf` | Object (Optional) | Logic determining if this question should be visible in the UI. |

---

## 4. Conditional Logic (`showIf`)
The `showIf` object allows for branching logic based on previous answers. It currently supports simple equality checks.

### Schema:
```json
"showIf": {
  "questionId": "reference_id",
  "equals": "Value"
}
```

### Attributes:
- **`questionId`**: Must match the `id` of a question appearing **earlier** in the assessment (usually within the same Category).
- **`equals`**: The specific response string that triggers the visibility of this question.

### Example:
Question B is only shown if Question A (`people_split_time`) is answered with "Yes".
```json
{
  "id": "people_split_time",
  "Question": "Do teammates split time?",
  ...
},
{
  "Question": "Is there a process for that?",
  "showIf": {
    "questionId": "people_split_time",
    "equals": "Yes"
  }
}
```

---

## 5. Metadata & Categories
The current version contains the following categories:

1. **Authority**: Leadership support and autonomy.
2. **Alignment**: Vision, strategy, and shared values.
3. **Resource Lifecycle**: Deprecation processes and team fluidity.
4. **People**: Team composition and internal/external support.
5. **Investment**: Budget, headcount, and learning/development.
6. **Infrastructure**: Tech stack, tooling, and communication.
