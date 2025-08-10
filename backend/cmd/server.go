package main

import (
	"log"
	"net/http"

	"ghp-copilot/internal/configs"
	"ghp-copilot/internal/llm"
	"ghp-copilot/internal/routers"
)

func main() {
	if err := configs.LoadEnv(); err != nil {
		log.Println("No .env file found or error loading .env:", err)
	}

	llm.Init()

	port := configs.GetEnv("PORT", "8000")

	r := routers.NewRouter()

	log.Println("Starting server on:", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
