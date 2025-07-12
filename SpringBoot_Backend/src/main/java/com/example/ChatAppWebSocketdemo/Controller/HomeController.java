package com.example.ChatAppWebSocketdemo.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller class for handling web requests.
 */
@Controller
public class HomeController {

    /**
     * Handles GET requests to the "/" endpoint.
     *
     * @return View name for the client page.
     */
    @GetMapping("/")
    public String index() {
        return "redirect:/client.html";
    }
}

//Create a Controller
//
//In controller we will handle the request and redirect it to the client.html page
//Currently controller have only one method named as index with the GetMapping of "/"
//which means when websites load this method will get invoked. This will only return the content of the HTML file.

//
//For the client side, we will create 2 input fields and one button for each.
//
//    The First Field will be for the user and a button to connect
//    The second field for writing the message and a button to send it.