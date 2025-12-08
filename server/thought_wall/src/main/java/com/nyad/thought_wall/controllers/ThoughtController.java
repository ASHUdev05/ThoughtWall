package com.nyad.thought_wall.controllers;

import com.nyad.thought_wall.entity.Thought;
import com.nyad.thought_wall.repository.ThoughtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/thoughts")
@CrossOrigin(origins = "${app.frontend.url}")
public class ThoughtController {

    @Autowired
    private ThoughtRepository repository;

    @GetMapping
    public Page<Thought> getAllThoughts(
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        // Sort: Pinned (True first), then CreatedAt (Newest first)
        Sort sort = Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt"));
        Pageable pageable = PageRequest.of(page, size, sort);

        if (tag != null && !tag.equals("All") && !tag.isEmpty()) {
            return repository.findByTag(tag, pageable);
        }
        return repository.findAll(pageable);
    }

    @PostMapping
    public Thought createThought(@RequestBody Thought thought) {
        return repository.save(thought);
    }

    @PutMapping("/{id}")
    public Thought updateThought(@PathVariable Long id, @RequestBody Thought updatedThought) {
        return repository.findById(id).map(thought -> {
            thought.setContent(updatedThought.getContent());
            thought.setTag(updatedThought.getTag());
            thought.setPinned(updatedThought.isPinned()); // Update pin status
            return repository.save(thought);
        }).orElseThrow(() -> new RuntimeException("Thought not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public void deleteThought(@PathVariable Long id) {
        repository.deleteById(id);
    }
    
    @PutMapping("/tags/migrate")
    public void migrateTag(@RequestParam String oldTag, @RequestParam String newTag) {
        repository.updateTagForThoughts(oldTag, newTag);
    }
}