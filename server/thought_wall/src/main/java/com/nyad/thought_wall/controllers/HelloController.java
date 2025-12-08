package com.nyad.thought_wall.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

	@CrossOrigin(origins = "${app.frontend.url}") // Allows React to access this
	@GetMapping("/hello")
	public String sayHello() {
		return "Hello from the server!";
	}
}
