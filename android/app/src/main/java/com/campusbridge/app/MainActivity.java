package com.campusbridge.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        requestMediaPermissions();

        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                // 1. Enable Full Cookies including Third-Party for Clerk & Cross-Domain Auth
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);

                WebSettings settings = this.bridge.getWebView().getSettings();
                
                // 2. Allow media playback without user gesture for WebRTC calls, audio ringtones & video streams
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setJavaScriptEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);

                // 3. Strips Android WebView indicators (; wv) so Google OAuth & SSO succeeds seamlessly
                String ua = settings.getUserAgentString();
                if (ua != null) {
                    String cleanUa = ua.replaceAll("; wv\\)", ")").replaceAll("Version/[0-9.]+\\s", "");
                    settings.setUserAgentString(cleanUa + " CampusBridgeMobile");
                }

                // 4. Override WebChromeClient to grant WebRTC audio & video permissions inside WebView
                this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        MainActivity.this.runOnUiThread(() -> {
                            try {
                                request.grant(request.getResources());
                            } catch (Exception e) {
                                // fallback if already handled
                            }
                        });
                    }
                });
            }
        } catch (Exception e) {
            // continue
        }
    }

    private void requestMediaPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean cameraGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
            boolean audioGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
            
            if (!cameraGranted || !audioGranted) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{
                        Manifest.permission.CAMERA,
                        Manifest.permission.RECORD_AUDIO,
                        Manifest.permission.MODIFY_AUDIO_SETTINGS
                    },
                    PERMISSION_REQUEST_CODE
                );
            }
        }
    }
}
