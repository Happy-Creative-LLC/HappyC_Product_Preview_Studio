package com.happycreative.productpreview.application.preview.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.application.preview.TaskTextContentUseCase;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.config.ContentProperties;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewPlatform;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.domain.preview.ProductData;
import com.happycreative.productpreview.dto.TextContentRequest;
import com.happycreative.productpreview.entity.Platform;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskEvent;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;
import com.happycreative.productpreview.repository.TaskEventRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.AccessControlService;
import com.happycreative.productpreview.service.AccessControlService.ContentZone;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskTextContentUseCaseImpl implements TaskTextContentUseCase {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final PreviewRepository previewRepository;
    private final TaskEventRepository taskEventRepository;
    private final AccessControlService accessControlService;
    private final PreviewMapper mapper;
    private final ContentProperties contentProperties;

    @Override
    @Transactional(readOnly = true)
    public PreviewDto getCurrent(UUID taskId, CustomUserDetails actor) {
        Task task = findVisibleTask(taskId, actor);
        List<Preview> previews = previewRepository.findByTaskId(task.getId());
        return previews.isEmpty() ? null : mapper.toDto(previews.getFirst());
    }

    @Override
    @Transactional
    public PreviewDto save(UUID taskId, TextContentRequest request, CustomUserDetails actor) {
        Task task = findVisibleTask(taskId, actor);
        accessControlService.requireZoneEditAccess(actor, ContentZone.TEXT);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung Text không hợp lệ.");
        }
        if (task.getPlatform() == Platform.AMAZON && request.productType() != null
                && !request.productType().isBlank()
                && !contentProperties.getAmazonProductTypes().contains(request.productType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Loại sản phẩm Amazon không có trong danh sách cho phép.");
        }

        User user = userRepository.findById(actor.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        List<Preview> previews = previewRepository.findByTaskId(taskId);
        boolean created = previews.isEmpty();
        Preview preview = created
                ? Preview.create(UUID.randomUUID(), PreviewPlatform.fromString(task.getPlatform().name()),
                        user.getId(), taskId, new ProductData("{}"))
                : previews.getFirst();
        ObjectNode data = (preview.getProductData() == null
                ? new ProductData("{}") : preview.getProductData()).toObjectNode();
        if (!data.has("title")) data.put("title", task.getTitle());
        put(data, "title", request.title());
        put(data, "price", request.price());
        put(data, "description", request.description());
        if (task.getPlatform() == Platform.AMAZON) {
            put(data, "brand", request.brand());
            put(data, "fabricType", request.fabricType());
            put(data, "careInstructions", request.careInstructions());
            put(data, "origin", request.origin());
            put(data, "bulletPoints", request.bulletPoints());
            put(data, "sizes", request.sizes());
            put(data, "searchTerms", request.searchTerms());
            put(data, "productType", request.productType());
        } else {
            put(data, "tags", request.tags());
            put(data, "materials", request.materials());
            put(data, "whoMade", request.whoMade());
            put(data, "whenMade", request.whenMade());
            put(data, "taxonomyPath", request.taxonomyPath());
            put(data, "quantity", request.quantity());
        }
        if (request.clearFields() != null) {
            for (String field : request.clearFields()) {
                if ("price".equals(field) || (task.getPlatform() == Platform.ETSY && "quantity".equals(field))) {
                    data.remove(field);
                }
            }
        }
        if (created) {
            // Preview mới bắt đầu ở version 1.
            preview = Preview.create(preview.getId().toUUID(), preview.getPlatform(),
                    preview.getOwnerId(), taskId, new ProductData(data.toString()));
        } else {
            preview.update(new ProductData(data.toString()));
        }
        previewRepository.save(preview);

        TaskEvent event = new TaskEvent();
        event.setTask(task);
        event.setActor(user);
        event.setEventType("TEXT_SAVED");
        event.setDetail("{\"previewId\":\"" + preview.getId().toUUID()
                + "\",\"version\":" + preview.getVersion() + "}");
        taskEventRepository.save(event);
        return mapper.toDto(preview);
    }

    private Task findVisibleTask(UUID taskId, CustomUserDetails actor) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy task."));
        accessControlService.requireTaskVisible(actor, task);
        return task;
    }

    private void put(ObjectNode data, String key, String value) {
        if (value != null) data.put(key, value);
    }

    private void put(ObjectNode data, String key, Double value) {
        if (value != null) data.put(key, value);
    }

    private void put(ObjectNode data, String key, Integer value) {
        if (value != null) data.put(key, value);
    }

    private void put(ObjectNode data, String key, List<String> values) {
        if (values != null) {
            var array = data.putArray(key);
            values.forEach(array::add);
        }
    }
}
