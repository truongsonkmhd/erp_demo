package com.xxxx.ddd.application.vldc.news;

import com.xxxx.ddd.application.vldc.AbstractCollectionService;
import com.xxxx.ddd.domain.model.entity.vldc.NewsPost;
import com.xxxx.ddd.domain.respository.vldc.NewsPostRepository;
import org.springframework.stereotype.Service;

@Service
public class NewsCollectionService extends AbstractCollectionService<NewsPostRow, NewsPost> {

    public NewsCollectionService(NewsPostRepository repository) {
        super(repository);
    }

    public String name() { return "news"; }

    public Class<NewsPostRow> rowType() { return NewsPostRow.class; }

    protected NewsPost toEntity(NewsPostRow row, NewsPost existing) {
        NewsPost post = existing != null ? existing : new NewsPost();
        post.setId(row.getId());
        NewsEventRow event = row.getEvent();
        return post.setKind(row.getKind())
                .setTitle(row.getTitle())
                .setSummary(row.getSummary())
                .setBody(row.getBody())
                .setAudience(row.getAudience())
                .setPinned(row.isPinned())
                .setStatus(row.getStatus())
                .setAuthorRole(row.getAuthorRole())
                .setAuthorName(row.getAuthorName())
                .setPublishedAt(row.getPublishedAt())
                .setEditedAt(row.getUpdatedAt())
                .setEventDate(event == null ? null : event.getDate())
                .setEventTime(event == null ? null : event.getTime())
                .setEventLocation(event == null ? null : event.getLocation());
    }

    protected NewsPostRow toRow(NewsPost post) {
        NewsPostRow row = new NewsPostRow();
        row.setId(post.getId());
        row.setKind(post.getKind());
        row.setTitle(post.getTitle());
        row.setSummary(post.getSummary());
        row.setBody(post.getBody());
        row.setAudience(post.getAudience());
        row.setPinned(post.isPinned());
        row.setStatus(post.getStatus());
        row.setAuthorRole(post.getAuthorRole());
        row.setAuthorName(post.getAuthorName());
        row.setPublishedAt(post.getPublishedAt());
        row.setUpdatedAt(post.getEditedAt());
        if (post.getEventDate() != null) {
            NewsEventRow event = new NewsEventRow();
            event.setDate(post.getEventDate());
            event.setTime(post.getEventTime());
            event.setLocation(post.getEventLocation());
            row.setEvent(event);
        }
        return row;
    }
}
