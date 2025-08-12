package handlers

import (
	"errors"
	"fmt"
	"ghp-copilot/internal/types"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h Handlers) GetInactives(w http.ResponseWriter, r *http.Request) {
	owner := chi.URLParam(r, "owner")
	repo := chi.URLParam(r, "repo")
	thresholdDaysStr := r.URL.Query().Get("threshold")
	threshold, err := strconv.Atoi(thresholdDaysStr)
	if err != nil {
		// SendResponse(w, map[string]any{"message": "Bad threshold days"}, http.StatusBadRequest)
		threshold = 3
	}

	prsResp, err1 := h.GithubApis.GetPullRequests(r.Context(), owner, repo, types.PRFilters{
		State:     "open",
		Sort:      "updatedAt",
		Direction: "asc",
		PerPage:   "100",
	})

	issuesResp, err2 := h.GithubApis.GetIssues(r.Context(), owner, repo, types.PRFilters{
		State:     "open",
		Sort:      "updatedAt",
		Direction: "asc",
		PerPage:   "100",
	})

	fmt.Println("resp: ", prsResp, issuesResp)

	err = errors.Join(err1, err2)
	if err != nil {
		log.Println(err)
		SendResponse(w, map[string]any{"message": "Something went wrong"}, http.StatusBadRequest)
		return
	}

	now := time.Now()
	thresholdDuration := time.Duration(threshold) * 24 * time.Hour
	inactivePrs := []types.PullRequest{}
	inactiveIssues := []types.Issue{}

	for _, item := range prsResp {
		if now.Sub(item.UpdatedAt) > thresholdDuration {
			item.DaysIdle = int(now.Sub(item.UpdatedAt).Hours() / 24)
			inactivePrs = append(inactivePrs, item)
		}
	}

	for _, item := range issuesResp {
		if now.Sub(item.UpdatedAt) > thresholdDuration {
			item.DaysIdle = int(now.Sub(item.UpdatedAt).Hours() / 24)
			inactiveIssues = append(inactiveIssues, item)
		}
	}

	fmt.Println("pull_requests", inactivePrs,
		"issues", inactiveIssues)

	SendResponse(w, map[string]any{
		"pull_requests": inactivePrs,
		"issues":        inactiveIssues,
	}, http.StatusOK)

}
