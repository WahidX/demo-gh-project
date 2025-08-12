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

	port := configs.GetEnv("PORT", "8080")

	r := routers.Init()

	log.Println("Starting server on:", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
