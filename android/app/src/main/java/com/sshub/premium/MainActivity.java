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
        settings.setUserAgentString(
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        );
    }
}
