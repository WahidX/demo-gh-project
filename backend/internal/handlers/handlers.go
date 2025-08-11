package handlers

import (
	"encoding/json"
	"ghp-copilot/pkg/githubapi"
	"net/http"
)

type Handlers struct {
	GithubApis *githubapi.GithubApis
}

func SendResponse(w http.ResponseWriter, response map[string]any, status int) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
