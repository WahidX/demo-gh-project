package routers

import (
	"ghp-copilot/internal/handlers"
	"ghp-copilot/pkg/githubapi"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func Init() *chi.Mux {
	r := chi.NewRouter()
	h := handlers.Handlers{
		GithubApis: githubapi.Init(),
	}

	r.Use(middleware.Logger, middleware.RequestID, middleware.Recoverer)

	// Add CORS middleware
	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedOrigins:   []string{"*"}, // Allow all origins for development
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Get("/ping", h.Ping)
	r.Post("/query", h.Query)
	r.Get("/inactive-items/{owner}/{repo}", h.GetInactives)

	r.Get("/pr-summary/{owner}/{repo}/{prNumber}", h.GeneratePRSummary)

	return r
}
