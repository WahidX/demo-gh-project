package handlers

import (
	"encoding/json"
	"net/http"
)

type Handlers struct{}

func SendResponse(w http.ResponseWriter, response map[string]any, status int) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
