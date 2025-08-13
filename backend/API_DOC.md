# Go Server API Documentation

## Base URL

All endpoints are relative to your server root (e.g., `http://localhost:8080/`).

---

### `GET /ping`

**Description:**  
Health check endpoint. Returns a simple JSON response.

**Response:**

```json
{
	"message": "pong"
}
```

---

### `POST /query`

**Description:**  
Processes a query using the LLM backend.

**Request Body:**  
Raw text (string).

**Response:**

```json
{
	"response": "<LLM response or error>"
}
```

---

### `GET /inactive-items/{owner}/{repo}?threshold=<days>`

**Description:**  
Returns inactive pull requests and issues for a given GitHub repository.

**Path Parameters:**

- `owner` (string): GitHub repository owner
- `repo` (string): GitHub repository name

**Query Parameters:**

- `threshold` (int, optional): Number of days to consider as inactive (default: 3)

**Response:**

```json
{
  "pull_requests": [ ... ],
  "issues": [ ... ]
}
```

Each item includes a `DaysIdle` field indicating how many days it has been inactive.

---

### `GET /pr-summary/{owner}/{repo}/{prNumber}`

**Description:**  
Generates a summary of a pull request using LLM.

**Path Parameters:**

- `owner` (string): GitHub repository owner
- `repo` (string): GitHub repository name
- `prNumber` (string): Pull request number

**Response:**

```json
{
	"summary": "<summary text>"
}
```

---

**Notes:**

- All responses are in JSON.
- CORS is enabled for all origins (for development).
- Errors are returned with appropriate HTTP status codes and a JSON message.
