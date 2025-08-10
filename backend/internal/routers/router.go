package routers

import (
	"ghp-copilot/internal/handlers"

	"github.com/go-chi/chi/v5"
)

func NewRouter() *chi.Mux {
	r := chi.NewRouter()
	h := handlers.Handlers{}

	r.Get("/ping", h.Ping)
	r.Post("/query", h.Query)

	r.Get("/pr-summary/{owner}/{repo}/{prNumber}", h.GeneratePRSummary)

	return r
}
