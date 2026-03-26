package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

var ErrKakaoAuth = errors.New("kakao authentication failed")

type KakaoUser struct {
	ID           int64
	Nickname     string
	ProfileImage string
}

type kakaoMeResponse struct {
	ID         int64 `json:"id"`
	Properties struct {
		Nickname       string `json:"nickname"`
		ProfileImage   string `json:"profile_image"`
		ThumbnailImage string `json:"thumbnail_image"`
	} `json:"properties"`
	KakaoAccount struct {
		Profile struct {
			Nickname        string `json:"nickname"`
			ProfileImageURL string `json:"profile_image_url"`
		} `json:"profile"`
	} `json:"kakao_account"`
}

func VerifyKakaoToken(accessToken string) (*KakaoUser, error) {
	req, err := http.NewRequest(http.MethodGet, "https://kapi.kakao.com/v2/user/me", nil)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrKakaoAuth, err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrKakaoAuth, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, ErrKakaoAuth
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrKakaoAuth, err)
	}

	var me kakaoMeResponse
	if err := json.Unmarshal(body, &me); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrKakaoAuth, err)
	}

	if me.ID == 0 {
		return nil, ErrKakaoAuth
	}

	// Prefer kakao_account profile, fall back to properties
	nickname := me.KakaoAccount.Profile.Nickname
	if nickname == "" {
		nickname = me.Properties.Nickname
	}
	profileImage := me.KakaoAccount.Profile.ProfileImageURL
	if profileImage == "" {
		profileImage = me.Properties.ProfileImage
	}

	return &KakaoUser{
		ID:           me.ID,
		Nickname:     nickname,
		ProfileImage: profileImage,
	}, nil
}
