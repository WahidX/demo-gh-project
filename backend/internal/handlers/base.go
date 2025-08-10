package handlers

import (
	"encoding/json"
	"ghp-copilot/internal/llm"
	"io"
	"net/http"
)

func (h Handlers) Ping(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "pong"})
}

func (h Handlers) Query(w http.ResponseWriter, r *http.Request) {
	queryBytes, err := io.ReadAll(r.Body)
	if err != nil {
		SendResponse(w, nil, http.StatusBadRequest)
		return
	}

	resp, err := llm.BaseQuery(r.Context(), string(queryBytes))
	if err != nil {
		SendResponse(w, map[string]any{"response": err}, http.StatusInternalServerError)
		return
	}

	SendResponse(w, map[string]any{"response": resp}, http.StatusOK)
}
