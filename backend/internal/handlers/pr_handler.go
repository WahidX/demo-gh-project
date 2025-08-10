package handlers

import (
	"context"
	"encoding/json"
	"ghp-copilot/internal/llm"
	"ghp-copilot/pkg/githubapi"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h Handlers) GeneratePRSummary(w http.ResponseWriter, r *http.Request) {
	owner := chi.URLParam(r, "owner")
	repo := chi.URLParam(r, "repo")
	prNumber := chi.URLParam(r, "prNumber")

	pr, err := githubapi.GetPullRequest(r.Context(), owner, repo, prNumber)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Println("pr: ", pr)

	files, err := githubapi.GetPullRequestFiles(r.Context(), owner, repo, prNumber)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Println("files: ", files)

	summary, err := llm.SummarizePRChanges(context.Background(), pr.Title, pr.Body, files)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/JSON")
	json.NewEncoder(w).Encode(map[string]string{"summary": summary})
}
