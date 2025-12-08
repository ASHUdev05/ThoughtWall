package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Thought;
import com.nyad.thought_wall.repository.ThoughtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thoughts") // Base URL for all actions here
@CrossOrigin(origins = "${app.frontend.url}") // Allows React to access this
public class ThoughtController {

    @Autowired
    private ThoughtRepository repository;

    // 1. GET all thoughts
    @GetMapping
    public List<Thought> getAllThoughts() {
        return repository.findAll();
    }

    // 2. CREATE a new thought
    @PostMapping
    public Thought createThought(@RequestBody Thought thought) {
        return repository.save(thought);
    }

    // 3. UPDATE a thought (Edit)
    @PutMapping("/{id}")
    public Thought updateThought(@PathVariable Long id, @RequestBody Thought updatedThought) {
        return repository.findById(id)
                .map(thought -> {
                    thought.setContent(updatedThought.getContent());
                    return repository.save(thought);
                })
                .orElseThrow(() -> new RuntimeException("Thought not found with id " + id));
    }

    // 4. DELETE a thought
    @DeleteMapping("/{id}")
    public String deleteThought(@PathVariable Long id) {
        repository.deleteById(id);
        return "Thought deleted successfully";
    }
}