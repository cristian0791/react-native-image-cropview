package com.example

import com.facebook.react.ReactActivity
import android.os.Bundle;

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String? {
        return "example"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
    }
}
