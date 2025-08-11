package githubapi

import (
	"ghp-copilot/internal/configs"
)

type GithubApis struct {
	ApiUrl  string
	AuthPat string
}

func Init() *GithubApis {
	return &GithubApis{
		ApiUrl:  "https://api.github.com",
		AuthPat: configs.GetEnv("GITHUB_TOKEN"),
	}
}
