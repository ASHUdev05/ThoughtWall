package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Thought;
import com.nyad.thought_wall.repository.ThoughtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thoughts")
@CrossOrigin(origins = "${app.frontend.url}")
public class ThoughtController {

    @Autowired
    private ThoughtRepository repository;

    @GetMapping
    public List<Thought> getAllThoughts() {
        // Fix: Sort by 'createdAt' descending (newest first)
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @PostMapping
    public Thought createThought(@RequestBody Thought thought) {
        return repository.save(thought);
    }

    @DeleteMapping("/{id}")
    public void deleteThought(@PathVariable Long id) {
        repository.deleteById(id);
    }
}