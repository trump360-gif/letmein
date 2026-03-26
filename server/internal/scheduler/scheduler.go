package scheduler

import (
	"log"
	"time"

	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
)

// Dependencies holds all repository and service references the schedulers need.
type Dependencies struct {
	UserRepo     repository.UserRepository
	ConsultRepo  repository.ConsultationRepository
	ChatSvc      service.ChatService
}

// StartAll launches all background schedulers as goroutines.
// It is non-blocking; call it once from main after initialising dependencies.
func StartAll(deps Dependencies) {
	go RunWithdrawalCleanup(deps)
	go RunMatchingEscalation(deps)
	go RunChatAutoClose(deps)
}

// ---------------------------------------------------------------------------
// 1. Withdrawal cleanup — 1 hour interval
// ---------------------------------------------------------------------------

// RunWithdrawalCleanup periodically purges users whose 7-day withdrawal grace
// period has elapsed. Users that requested withdrawal more than 7 days ago
// (status='withdrawing') have their PII anonymised and status set to 'withdrawn'.
func RunWithdrawalCleanup(deps Dependencies) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run immediately on start, then every tick.
	runWithdrawalCleanup(deps)
	for range ticker.C {
		runWithdrawalCleanup(deps)
	}
}

func runWithdrawalCleanup(deps Dependencies) {
	threshold := time.Now().Add(-7 * 24 * time.Hour)

	users, err := deps.UserRepo.GetWithdrawingUsers(threshold)
	if err != nil {
		log.Printf("[scheduler/withdrawal] get withdrawing users: %v", err)
		return
	}
	if len(users) == 0 {
		return
	}

	log.Printf("[scheduler/withdrawal] purging %d user(s)", len(users))
	for _, u := range users {
		if err := deps.UserRepo.PurgeWithdrawnUser(u.ID); err != nil {
			log.Printf("[scheduler/withdrawal] purge user %d: %v", u.ID, err)
			continue
		}
		log.Printf("[scheduler/withdrawal] purged user %d", u.ID)
	}
}

// ---------------------------------------------------------------------------
// 2. Matching SLA escalation — 5 minute interval
// ---------------------------------------------------------------------------

const matchingEscalationThreshold = 2 * time.Hour

// RunMatchingEscalation checks every 5 minutes for consultation requests that
// have been waiting for a coordinator match for more than 2 hours and logs an
// escalation alert. Each request is only escalated once (escalated_at flag).
func RunMatchingEscalation(deps Dependencies) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	runMatchingEscalation(deps)
	for range ticker.C {
		runMatchingEscalation(deps)
	}
}

func runMatchingEscalation(deps Dependencies) {
	threshold := time.Now().Add(-matchingEscalationThreshold)

	reqs, err := deps.ConsultRepo.GetUnmatchedRequestsOlderThan(threshold)
	if err != nil {
		log.Printf("[scheduler/escalation] get unmatched requests: %v", err)
		return
	}
	if len(reqs) == 0 {
		return
	}

	log.Printf("[scheduler/escalation] %d request(s) require escalation", len(reqs))
	for _, req := range reqs {
		age := time.Since(req.CreatedAt).Round(time.Minute)
		log.Printf("[scheduler/escalation] ALERT request_id=%d user_id=%d age=%v — no coordinator assigned",
			req.ID, req.UserID, age)

		if err := deps.ConsultRepo.MarkEscalated(req.ID); err != nil {
			log.Printf("[scheduler/escalation] mark escalated request %d: %v", req.ID, err)
		}
	}
}

// ---------------------------------------------------------------------------
// 3. Chat auto-close — 1 hour interval
// ---------------------------------------------------------------------------

// RunChatAutoClose closes chat rooms that have had no activity for 30 days.
func RunChatAutoClose(deps Dependencies) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	runChatAutoClose(deps)
	for range ticker.C {
		runChatAutoClose(deps)
	}
}

func runChatAutoClose(deps Dependencies) {
	if err := deps.ChatSvc.AutoCloseExpired(); err != nil {
		log.Printf("[scheduler/chat-close] auto close expired: %v", err)
		return
	}
	log.Printf("[scheduler/chat-close] auto-close cycle complete")
}
