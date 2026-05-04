package com.sshub.premium;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Remove "wv" WebView flag from User-Agent so Google GSI
        // does not block sign-in in embedded WebView environments.
        WebSettings settings = getBridge().getWebView().getSettings();
        String ua = settings.getUserAgentString();
        ua = ua.replace("; wv)", ")").replace(" wv ", " ");
        settings.setUserAgentString(ua);
    }
}
