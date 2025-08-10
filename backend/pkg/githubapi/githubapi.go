package githubapi

import (
	"context"
	"encoding/json"
	"fmt"
	"ghp-copilot/internal/configs"
	"io"
	"net/http"
)

const GITHUB_API_URL = "https://api.github.com"

var GITHUB_PAT = configs.GetEnv("GITHUB_TOKEN")

type PullRequest struct {
	Title  string `json:"title"`
	Body   string `json:"body"`
	Number int    `json:"number"`
	State  string `json:"state"`
	User   struct {
		Login string `json:"login"`
	} `json:"user"`
	Files []PRFile `json:"files"`
}

func GetPullRequest(ctx context.Context, owner, repo string, prNumber string) (*PullRequest, error) {
	GITHUB_PAT = configs.GetEnv("GITHUB_TOKEN")
	if GITHUB_PAT == "" {
		return nil, fmt.Errorf("GITHUB_TOKEN not set in environment")
	}
	url := fmt.Sprintf("%s/repos/%s/%s/pulls/%s", GITHUB_API_URL, owner, repo, prNumber)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+GITHUB_PAT)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s", string(body))
	}

	var pr PullRequest
	if err := json.NewDecoder(resp.Body).Decode(&pr); err != nil {
		return nil, err
	}
	return &pr, nil
}

type PRFile struct {
	Filename  string `json:"filename"`
	Status    string `json:"status"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Changes   int    `json:"changes"`
	Patch     string `json:"patch,omitempty"`
}

func GetPullRequestFiles(ctx context.Context, owner, repo string, prNumber string) ([]PRFile, error) {
	GITHUB_PAT = configs.GetEnv("GITHUB_TOKEN")
	if GITHUB_PAT == "" {
		return nil, fmt.Errorf("GITHUB_TOKEN not set in environment")
	}
	url := fmt.Sprintf("%s/repos/%s/%s/pulls/%s/files", GITHUB_API_URL, owner, repo, prNumber)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+GITHUB_PAT)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s", string(body))
	}

	var files []PRFile
	if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
		return nil, err
	}
	return files, nil
}
