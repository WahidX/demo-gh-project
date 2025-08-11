package routers

import (
	"ghp-copilot/internal/handlers"
	"ghp-copilot/pkg/githubapi"

	"github.com/go-chi/chi/v5"
)

func Init() *chi.Mux {
	r := chi.NewRouter()
	h := handlers.Handlers{
		GithubApis: githubapi.Init(),
	}

	r.Get("/ping", h.Ping)
	r.Post("/query", h.Query)
	r.Get("/inactive-items/{owner}/{repo}", h.GetInactives)

	r.Get("/pr-summary/{owner}/{repo}/{prNumber}", h.GeneratePRSummary)

	return r
}
