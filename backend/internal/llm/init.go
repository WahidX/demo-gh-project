package llm

import (
	"ghp-copilot/internal/configs"
	"log"

	"github.com/tmc/langchaingo/llms/ollama"
)

var llmModel *ollama.LLM

func Init() {
	var err error
	llmModel, err = ollama.New(
		ollama.WithModel(configs.GetEnv("OLLAMA_MODEL", "gpt-oss:20b")),
		ollama.WithServerURL(configs.GetEnv("OLLAMA_SERVER_URL", "http://localhost:11434")),
	)
	if err != nil {
		log.Fatalf("failed to initialize LLM: %v", err)
	}
}
