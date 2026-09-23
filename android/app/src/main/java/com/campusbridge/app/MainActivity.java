package com.campusbridge.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebSettings settings = this.bridge.getWebView().getSettings();
                String ua = settings.getUserAgentString();
                if (ua != null) {
                    // Strips Android WebView indicators (; wv) and Version/X.X so Google OAuth succeeds seamlessly
                    String cleanUa = ua.replaceAll("; wv\\)", ")").replaceAll("Version/[0-9.]+\\s", "");
                    settings.setUserAgentString(cleanUa + " CampusBridgeMobile");
                }
            }
        } catch (Exception e) {
            // continue
        }
    }
}
