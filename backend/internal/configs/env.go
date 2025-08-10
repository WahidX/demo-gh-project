package configs

import (
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() error {
	return godotenv.Load()
}

func GetEnv(key string, defaultValue ...string) string {
	val := os.Getenv(key)
	if val == "" && len(defaultValue) > 0 {
		return defaultValue[0]
	}
	return val
}
